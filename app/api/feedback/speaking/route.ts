import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai-client";
import type { SpeakingFeedback } from "@/lib/types";

export const runtime = "nodejs";

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
