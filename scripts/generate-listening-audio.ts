const { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } = require("node:fs") as typeof import("node:fs");
const { join, resolve } = require("node:path") as typeof import("node:path");

type ListeningBank = ListeningItem[];

type ListeningItem = {
  id: string;
  skill: string;
  title: string;
  payload?: {
    audioUrl?: string;
    transcript?: string;
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
    const transcript = item.payload?.transcript?.trim();
    if (!transcript) {
      console.warn(`[skip] ${item.id}: missing transcript`);
      skippedCount += 1;
      continue;
    }
    if (transcript.length >= 10_000) {
      throw new Error(`${item.id}: transcript is ${transcript.length} characters; MiniMax HTTP T2A requires under 10,000.`);
    }

    const filename = `${item.id}.mp3`;
    const relativeAudioUrl = `/audio/listening/${filename}`;
    const outputPath = join(audioDir, filename);
    const stale = !existsSync(outputPath) || statSync(outputPath).size === 0 || statSync(outputPath).mtimeMs < bankModifiedAt;

    if (!stale) {
      if (item.payload && item.payload.audioUrl !== relativeAudioUrl) {
        item.payload.audioUrl = relativeAudioUrl;
        updatedBank = true;
      }
      console.log(`[skip] ${item.id}: existing audio is current`);
      skippedCount += 1;
      continue;
    }

    console.log(`[generate] ${item.id}: ${model}`);
    const audio = await synthesizeSpeech(transcript, model, apiKey);
    if (audio.length === 0) {
      throw new Error(`${item.id}: MiniMax returned an empty audio buffer.`);
    }

    writeFileSync(outputPath, audio);
    const savedSize = statSync(outputPath).size;
    if (savedSize === 0) {
      throw new Error(`${item.id}: saved MP3 is empty.`);
    }

    if (item.payload) {
      item.payload.audioUrl = relativeAudioUrl;
      updatedBank = true;
    }
    generatedCount += 1;
    console.log(`[ok] ${item.id}: saved ${relativeAudioUrl} (${savedSize} bytes)`);
  }

  if (updatedBank) {
    writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
    console.log("[ok] updated content/listening/bank.json audioUrl fields");
  }

  console.log(`[done] generated ${generatedCount}, skipped ${skippedCount}`);
}

async function synthesizeSpeech(text: string, selectedModel: string, token: string): Promise<Buffer> {
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
        voice_id: "English_expressive_narrator",
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
