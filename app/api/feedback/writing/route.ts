import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai-client";
import type { WritingFeedback } from "@/lib/types";

export const runtime = "nodejs";

const MAX_PROMPT_CHARS = 4_000;
const MAX_RESPONSE_CHARS = 16_000;
const ALLOWED_TASK_TYPES = new Set(["task1", "task2", "micro_thesis", "paragraph_drill"]);

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
    if (!ALLOWED_TASK_TYPES.has(taskType)) {
      return NextResponse.json({ error: "Unsupported writing task type" }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_CHARS || text.length > MAX_RESPONSE_CHARS) {
      return NextResponse.json({ error: "Submission is too long. Please shorten it and retry." }, { status: 413 });
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
