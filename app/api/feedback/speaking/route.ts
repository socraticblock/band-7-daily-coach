import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai-client";
import type { SpeakingFeedback } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PROMPT_CHARS = 4_000;
const MAX_TRANSCRIPT_CHARS = 12_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { part, prompt, transcript, transcriptConfidence, answerSeconds } = body as {
      part: 1 | 2 | 3;
      prompt: string;
      transcript: string;
      transcriptConfidence: "high" | "medium" | "low";
      answerSeconds: number;
    };
    if (!prompt || !transcript) {
      return NextResponse.json({ error: "Missing prompt or transcript" }, { status: 400 });
    }
    if (![1, 2, 3].includes(part)) {
      return NextResponse.json({ error: "Unsupported speaking part" }, { status: 400 });
    }
    if (!(["high", "medium", "low"] as const).includes(transcriptConfidence)) {
      return NextResponse.json({ error: "Invalid transcript confidence" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_CHARS || transcript.length > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json({ error: "Transcript is too long. Please shorten it and retry." }, { status: 413 });
    }
    const feedback = (await generateFeedback({
      kind: "speaking",
      part,
      prompt,
      transcript,
      transcriptConfidence,
      answerSeconds,
    })) as SpeakingFeedback;
    return NextResponse.json(feedback);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
