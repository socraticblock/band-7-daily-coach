// ============================================================================
// AI CLIENT — server-side wrapper that calls OpenAI if a key is configured,
// otherwise returns a structured mock. Mocks are allowed for private prototype
// UX testing, but production should set OPENAI_API_KEY and disable demo mode.
// ============================================================================

import type { WritingFeedback, SpeakingFeedback, MistakeCode } from "@/lib/types";
import {
  WRITING_FEEDBACK_SYSTEM,
  WRITING_FEEDBACK_USER_TEMPLATE,
  SPEAKING_FEEDBACK_SYSTEM,
  SPEAKING_FEEDBACK_USER_TEMPLATE,
  CLASSIFIER_SYSTEM,
  classifierUserTemplate,
} from "@/lib/ai-prompts";
import { isValidMistakeCode } from "@/lib/mistake-taxonomy";
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

const MOCK_ALLOWED = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV !== "production";

function requireApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

function parseJsonObject<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("AI returned invalid JSON. Please retry.");
  }
}

async function postOpenAIChat(apiKey: string, body: unknown): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`AI provider error ${res.status}. Please check the API key and try again.`);
  }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response. Please retry.");
  return content;
}

export async function generateFeedback(input: FeedbackInput): Promise<WritingFeedback | SpeakingFeedback> {
  const apiKey = requireApiKey();
  if (!apiKey) {
    if (!MOCK_ALLOWED) throw new Error("AI feedback is not configured. Set OPENAI_API_KEY.");
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
  const content = await postOpenAIChat(apiKey, {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
  });
  return parseJsonObject<WritingFeedback | SpeakingFeedback>(content);
}

export async function generateClassification(input: ClassifierInput): Promise<ClassifierOutput> {
  const apiKey = requireApiKey();
  if (!apiKey) {
    if (!MOCK_ALLOWED) throw new Error("Mistake classification is not configured. Set OPENAI_API_KEY.");
    const defaults: Record<ClassifierInput["skillScope"], MistakeCode> = {
      listening: "L4",
      reading: "R1",
      writing: "W1",
      speaking: "S2",
    };
    return {
      code: defaults[input.skillScope],
      confidence: "low",
      reason: "No OpenAI key configured; returning demo classifier output.",
      reviewCard: {
        front: input.description.slice(0, 120),
        expectedAnswer: "Recurring pattern — review a similar exercise.",
        explanation: "Set OPENAI_API_KEY to enable real-time mistake classification.",
      },
    };
  }

  const content = await postOpenAIChat(apiKey, {
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CLASSIFIER_SYSTEM },
      { role: "user", content: classifierUserTemplate(input.description, input.skillScope) },
    ],
    temperature: 0.1,
  });
  const parsed = parseJsonObject<ClassifierOutput>(content);
  if (!isValidMistakeCode(parsed.code)) {
    throw new Error("AI classifier returned an invalid mistake code.");
  }
  return parsed;
}

export async function transcribeAudio(audio: Blob): Promise<{ transcript: string; confidence: "high" | "medium" | "low" }> {
  const apiKey = requireApiKey();
  if (!apiKey) {
    if (!MOCK_ALLOWED) throw new Error("Speech transcription is not configured. Set OPENAI_API_KEY.");
    return mockTranscribe();
  }

  const model = process.env.OPENAI_TRANSCRIPTION_MODEL ?? "whisper-1";
  const fd = new FormData();
  fd.append("model", model);
  fd.append("file", audio, "recording.webm");
  fd.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });
  if (!res.ok) {
    throw new Error(`Speech transcription failed ${res.status}. Please retry or upload a smaller audio file.`);
  }
  const json = await res.json() as { text?: string };
  return {
    transcript: json.text?.trim() || "",
    confidence: "medium",
  };
}
