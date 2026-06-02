import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai-client";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI transcription endpoint limit class; keep uploads bounded.
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
]);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    if (audio.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio file is too large. Please upload a shorter recording." }, { status: 413 });
    }
    if (audio.type && !ALLOWED_AUDIO_TYPES.has(audio.type)) {
      return NextResponse.json({ error: "Unsupported audio format. Please use webm, mp3, m4a, wav, or ogg." }, { status: 415 });
    }
    const result = await transcribeAudio(audio);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
