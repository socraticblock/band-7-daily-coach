import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai-client";
import type { WritingFeedback } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskType, prompt, text, wordCount } = body as {
      taskType: string;
      prompt: string;
      text: string;
      wordCount: number;
    };
    if (!prompt || !text) {
      return NextResponse.json({ error: "Missing prompt or text" }, { status: 400 });
    }
    const feedback = (await generateFeedback({
      kind: "writing",
      taskType,
      prompt,
      text,
      wordCount,
    })) as WritingFeedback;
    return NextResponse.json(feedback);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
