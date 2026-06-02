// ============================================================================
// AI CLIENT — server-side wrapper that calls OpenAI if a key is configured,
// otherwise returns a structured mock. The mock logic lives in feedback-mock.ts
// so it can be reused on the client (for static export demo mode).
// ============================================================================

import type { WritingFeedback, SpeakingFeedback, MistakeCode } from "@/lib/types";
import { WRITING_FEEDBACK_SYSTEM, WRITING_FEEDBACK_USER_TEMPLATE, SPEAKING_FEEDBACK_SYSTEM, SPEAKING_FEEDBACK_USER_TEMPLATE } from "@/lib/ai-prompts";
import { mockWritingFeedback, mockSpeakingFeedback, mockTranscribe } from "./feedback-mock";

export type FeedbackInput =
  | { kind: "writing"; taskType: string; prompt: string; text: string; wordCount: number }
  | { kind: "speaking"; part: 1 | 2 | 3; prompt: string; transcript: string; transcriptConfidence: "high" | "medium" | "low"; answerSeconds: number };

export type ClassifierInput = { description: string; skillScope: "listening" | "reading" | "writing" | "speaking" };

export type ClassifierOutput = {
  code: MistakeCode;
  confidence: "high" | "medium" | "low";
  reason: string;
  reviewCard: { front: string; expectedAnswer: string; explanation: string };
};

export async function generateFeedback(input: FeedbackInput): Promise<WritingFeedback | SpeakingFeedback> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return input.kind === "writing"
      ? mockWritingFeedback(input)
      : mockSpeakingFeedback(input);
  }
  const system = input.kind === "writing" ? WRITING_FEEDBACK_SYSTEM : SPEAKING_FEEDBACK_SYSTEM;
  const user =
    input.kind === "writing"
      ? WRITING_FEEDBACK_USER_TEMPLATE(input.taskType, input.prompt, input.text, input.wordCount)
      : SPEAKING_FEEDBACK_USER_TEMPLATE(input.part, input.prompt, input.transcript, input.transcriptConfidence, input.answerSeconds);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }
  const j = await res.json() as { choices: { message: { content: string } }[] };
  const content = j.choices[0]?.message.content ?? "{}";
  return JSON.parse(content) as WritingFeedback | SpeakingFeedback;
}

export async function generateClassification(input: ClassifierInput): Promise<ClassifierOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const defaults: Record<ClassifierInput["skillScope"], MistakeCode> = {
      listening: "L4",
      reading: "R1",
      writing: "W1",
      speaking: "S2",
    };
    return {
      code: defaults[input.skillScope],
      confidence: "low",
      reason: "No OpenAI key configured; returning default code.",
      reviewCard: {
        front: input.description.slice(0, 120),
        expectedAnswer: "Recurring pattern — review a similar exercise.",
        explanation: "Set OPENAI_API_KEY to enable real-time mistake classification.",
      },
    };
  }
  return {
    code: "W1",
    confidence: "low",
    reason: "Classifier not implemented in this build.",
    reviewCard: {
      front: input.description.slice(0, 120),
      expectedAnswer: "—",
      explanation: "—",
    },
  };
}

export async function transcribeAudio(_audio: Blob): Promise<{ transcript: string; confidence: "high" | "medium" | "low" }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return mockTranscribe();
  }
  // Real Whisper path — call the multipart endpoint
  // (omitted for the prototype to keep deps minimal; documented in the README).
  return mockTranscribe();
}
