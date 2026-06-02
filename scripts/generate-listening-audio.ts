/**
 * Generate one MP3 per listening item in content/listening/bank.json.
 *
 * Per-turn multi-voice generation (V1): when an item has payload.turns,
 * we call the MiniMax HTTP T2A v2 endpoint once per turn (each with its
 * own voice_id), prepend a 0.4s pause marker <#0.4#> to every non-first
 * turn, and byte-concatenate the resulting MP3 segments. No re-encoding,
 * no quality loss. Speaker labels in the visible transcript are NEVER
 * sent to TTS.
 *
 * Legacy fallback: when an item has no turns, we synthesise the whole
 * transcript as a single voice (this is the V0.1 behaviour).
 *
 * Idempotency: an item is regenerated only when:
 *   - the audio file is missing or empty, or
 *   - the audio file is older than the bank.json mtime, or
 *   - the audioUrl in bank.json no longer matches the expected path.
 *
 * Required env: MINIMAX_API_KEY. Optional: MINIMAX_TTS_MODEL (defaults to
 * speech-2.8-hd).
 *
 * Run: `npm run generate:listening-audio`
 */

const { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } = require("node:fs") as typeof import("node:fs");
const { join, resolve } = require("node:path") as typeof import("node:path");

type ListeningBank = ListeningItem[];

type ListeningTurn = {
  speaker: string;
  voiceId?: string;
  text: string;
};

type ListeningItem = {
  id: string;
  skill: string;
  title: string;
  payload?: {
    audioUrl?: string;
    transcript?: string;
    turns?: ListeningTurn[];
    questions?: unknown[];
  };
};

type MiniMaxTtsResponse = {
  data?: {
    audio?: string;
    status?: number;
  } | null;
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
  trace_id?: string;
};

const repoRoot = resolve(__dirname, "..");
const bankPath = join(repoRoot, "content", "listening", "bank.json");
const audioDir = join(repoRoot, "public", "audio", "listening");
const endpoint = "https://api.minimax.io/v1/t2a_v2";
// Fallback voice for items that have no turns (legacy single-voice mode) AND
// for any turn that arrives without an explicit voiceId.
const FALLBACK_VOICE_ID = "English_expressive_narrator";
// Pause injected before every non-first turn. 0.4s requested → ~0.33-0.4s actual.
const TURN_PAUSE_SECONDS = "0.4";

void main();

async function main(): Promise<void> {
  loadLocalEnv();

  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  const model = process.env.MINIMAX_TTS_MODEL?.trim() || "speech-2.8-hd";

  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is missing. Add it to your shell environment or .env.local before generating audio.");
  }

  const bank = JSON.parse(readFileSync(bankPath, "utf8")) as ListeningBank;
  const bankModifiedAt = statSync(bankPath).mtimeMs;
  mkdirSync(audioDir, { recursive: true });

  let generatedCount = 0;
  let skippedCount = 0;
  let updatedBank = false;

  for (const item of bank) {
    if (item.skill !== "listening") continue;
    const payload = item.payload;
    if (!payload) {
      console.warn(`[skip] ${item.id}: missing payload`);
      skippedCount += 1;
      continue;
    }

    const turns = payload.turns;
    const transcript = payload.transcript?.trim();
    if (!turns || turns.length === 0) {
      if (!transcript) {
        console.warn(`[skip] ${item.id}: missing transcript and turns`);
        skippedCount += 1;
        continue;
      }
      console.warn(`[fallback] ${item.id}: no turns — using single-voice legacy synthesis`);
    }

    // The total spoken text (for the 10k-char guardrail).
    const totalChars = (turns && turns.length > 0)
      ? turns.reduce((n, t) => n + t.text.length, 0)
      : (transcript?.length ?? 0);
    if (totalChars >= 10_000) {
      throw new Error(`${item.id}: total spoken text is ${totalChars} characters; MiniMax HTTP T2A requires under 10,000.`);
    }

    const filename = `${item.id}.mp3`;
    const relativeAudioUrl = `/audio/listening/${filename}`;
    const outputPath = join(audioDir, filename);
    const stale = !existsSync(outputPath) || statSync(outputPath).size === 0 || statSync(outputPath).mtimeMs < bankModifiedAt;

    if (!stale) {
      if (payload.audioUrl !== relativeAudioUrl) {
        payload.audioUrl = relativeAudioUrl;
        updatedBank = true;
      }
      console.log(`[skip] ${item.id}: existing audio is current`);
      skippedCount += 1;
      continue;
    }

    console.log(`[generate] ${item.id}: ${model}${turns && turns.length > 0 ? ` (${turns.length} turns)` : " (single voice)"}`);

    let audio: Buffer;
    if (turns && turns.length > 0) {
      audio = await synthesizeTurns(turns, model, apiKey);
    } else {
      audio = await synthesizeSpeech(transcript ?? "", FALLBACK_VOICE_ID, model, apiKey);
    }

    if (audio.length === 0) {
      throw new Error(`${item.id}: MiniMax returned an empty audio buffer.`);
    }

    writeFileSync(outputPath, audio);
    const savedSize = statSync(outputPath).size;
    if (savedSize === 0) {
      throw new Error(`${item.id}: saved MP3 is empty.`);
    }

    payload.audioUrl = relativeAudioUrl;
    updatedBank = true;
    generatedCount += 1;
    console.log(`[ok] ${item.id}: saved ${relativeAudioUrl} (${savedSize} bytes)`);
  }

  if (updatedBank) {
    writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
    console.log("[ok] updated content/listening/bank.json audioUrl fields");
  }

  console.log(`[done] generated ${generatedCount}, skipped ${skippedCount}`);
}

/**
 * Synthesise one MP3 segment per turn and concatenate them at the MPEG
 * frame boundary. Each non-first turn is preceded by a <#TURN_PAUSE_SECONDS#>
 * pause marker. No re-encoding → no quality loss.
 */
async function synthesizeTurns(turns: ListeningTurn[], model: string, token: string): Promise<Buffer> {
  const segments: Buffer[] = [];
  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i]!;
    const voiceId = turn.voiceId?.trim() || FALLBACK_VOICE_ID;
    // The visible transcript keeps the speaker label, but the audio MUST NOT
    // speak the label. Strip it again here as a defence-in-depth measure in
    // case the bank was hand-edited with a label inside the turn text.
    let turnText = turn.text;
    if (turn.speaker) {
      const labelPrefix = new RegExp(`^\\s*${escapeRegExp(turn.speaker)}\\s*:\\s*`, "i");
      turnText = turnText.replace(labelPrefix, "");
    }
    turnText = turnText.trim();
    if (!turnText) {
      console.warn(`[warn] turn ${i + 1} of ${turns.length} is empty after label strip; skipping`);
      continue;
    }
    // Inject the pause marker for every non-first turn.
    const finalText = i === 0 ? turnText : `<#${TURN_PAUSE_SECONDS}#> ${turnText}`;
    console.log(`  [turn ${i + 1}/${turns.length}] speaker=${turn.speaker} voice=${voiceId} chars=${turnText.length}`);
    const seg = await synthesizeSpeech(finalText, voiceId, model, token);
    segments.push(stripToMpegFrame(seg));
  }
  if (segments.length === 0) {
    throw new Error("All turns were empty after label strip — refusing to emit a silent MP3.");
  }
  // Prepend a single fresh ID3v2.3 tag so the file is identifiable. This is
  // optional (most players don't need it) but keeps the file shape similar to
  // the per-call TTS output.
  return prependId3v2(Buffer.concat(segments), "TIT2", "Band 7 Daily Coach — Listening");
}

async function synthesizeSpeech(text: string, voiceId: string, selectedModel: string, token: string): Promise<Buffer> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      text,
      stream: false,
      language_boost: "English",
      output_format: "hex",
      voice_setting: {
        voice_id: voiceId,
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  const rawText = await response.text();
  let json: MiniMaxTtsResponse;
  try {
    json = JSON.parse(rawText) as MiniMaxTtsResponse;
  } catch {
    throw new Error(`MiniMax TTS returned non-JSON response with status ${response.status}.`);
  }

  const statusCode = json.base_resp?.status_code;
  if (!response.ok || (typeof statusCode === "number" && statusCode !== 0)) {
    const statusMsg = json.base_resp?.status_msg ?? "unknown error";
    const traceId = json.trace_id ? ` trace_id=${json.trace_id}` : "";
    throw new Error(`MiniMax TTS failed: HTTP ${response.status}, status_code=${statusCode ?? "n/a"}, message=${statusMsg}.${traceId}`);
  }

  const hexAudio = json.data?.audio;
  if (!hexAudio) {
    const traceId = json.trace_id ? ` trace_id=${json.trace_id}` : "";
    throw new Error(`MiniMax TTS response did not include data.audio.${traceId}`);
  }

  return Buffer.from(hexAudio, "hex");
}

/**
 * Drop everything up to and including the first MPEG frame sync (0xFF 0xFB/E0..0xFF 0xFF).
 * The TTS response includes an ID3v2 tag at the start; concatenating the ID3
 * tag of segment N+1 would corrupt the stream. Strip it.
 *
 * The first valid MPEG frame sync in an MP3 file is one of:
 *   11 sync bits set: 0xFFE0..0xFFFF (we accept anything with the top 11 bits set,
 *   i.e. byte == 0xFF and next byte in 0xE0..0xFF).
 */
function stripToMpegFrame(mp3: Buffer): Buffer {
  for (let i = 0; i < mp3.length - 1; i += 1) {
    if (mp3[i] === 0xff && mp3[i + 1]! >= 0xe0) {
      return mp3.subarray(i);
    }
  }
  // No frame sync found — return the whole thing and let the player fail loudly.
  return mp3;
}

/**
 * Prepend a minimal ID3v2.3 tag with a single TIT2 (title) frame. This is
 * optional — most MP3 players don't need a leading ID3 tag because each
 * MPEG frame is self-contained — but it keeps the file looking like a real
 * TTS output and gives it a recognisable title in file managers.
 */
function prependId3v2(payload: Buffer, frameId: string, frameValue: string): Buffer {
  // Encode the text as ISO-8859-1 (ID3v2.3 default for TIT2 unless a BOM is present).
  const textBytes = Buffer.from(frameValue, "latin1");
  // Frame body: encoding byte (0x00 = ISO-8859-1) + text
  const frameBody = Buffer.concat([Buffer.from([0x00]), textBytes]);
  // Frame header: ID (4) + size (4, big-endian synchsafe) + flags (2)
  const frameHeader = Buffer.alloc(10);
  frameHeader.write(frameId, 0, 4, "ascii");
  frameHeader.writeUInt32BE(frameBody.length, 4);
  // flags = 0
  // Tag header: "ID3" + version (2 bytes) + flags (1) + size (4, synchsafe)
  const tagHeader = Buffer.alloc(10);
  tagHeader.write("ID3", 0, 3, "ascii");
  tagHeader.writeUInt8(3, 3);  // major version
  tagHeader.writeUInt8(0, 4);  // minor version
  tagHeader.writeUInt8(0, 5);  // flags
  // synchsafe size = 10 (header) + 10 (frame header) + frameBody.length
  const tagSize = 10 + frameBody.length;
  tagHeader.writeUInt32BE(toSynchsafe(tagSize), 6);
  return Buffer.concat([tagHeader, frameHeader, frameBody, payload]);
}

function toSynchsafe(n: number): number {
  // 28-bit big-endian: 7 bits per byte, high bit zero
  return (
    ((n >> 21) & 0x7f) << 24 |
    ((n >> 14) & 0x7f) << 16 |
    ((n >> 7) & 0x7f) << 8 |
    (n & 0x7f)
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    const envPath = join(repoRoot, file);
    if (!existsSync(envPath)) continue;
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      if (process.env[key]) continue;
      const rawValue = trimmed.slice(separator + 1).trim();
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}
