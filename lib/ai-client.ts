// ============================================================================
// AI CLIENT - server-side wrapper for provider API calls. MiniMax is preferred
// when MINIMAX_API_KEY is configured; OpenAI remains available as a fallback and
// for speech transcription. Mock responses are allowed only in explicit demo mode.
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

type ChatProvider = {
  apiKey: string;
  endpoint: string;
  model: string;
  name: "MiniMax" | "OpenAI";
};

const MOCK_ALLOWED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function getChatProvider(): ChatProvider | null {
  if (process.env.MINIMAX_API_KEY) {
    return {
      apiKey: process.env.MINIMAX_API_KEY,
      endpoint: "https://api.minimax.io/v1/chat/completions",
      model: process.env.MINIMAX_MODEL || "MiniMax-M3",
      name: "MiniMax",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      name: "OpenAI",
    };
  }
  return null;
}

function requireOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

function parseJsonObject<T>(content: string): T {
  const withoutThinking = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const candidate = withoutThinking.startsWith("{")
    ? withoutThinking
    : withoutThinking.slice(withoutThinking.indexOf("{"), withoutThinking.lastIndexOf("}") + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new Error("AI returned invalid JSON. Please retry.");
  }
}

async function postChat(provider: ChatProvider, body: unknown): Promise<string> {
  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${provider.name} provider error ${res.status}. Please check the API key and try again.`);
  }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response. Please retry.");
  return content;
}

export async function generateFeedback(input: FeedbackInput): Promise<WritingFeedback | SpeakingFeedback> {
  const provider = getChatProvider();
  if (!provider) {
    if (!MOCK_ALLOWED) throw new Error("AI feedback is not configured. Add MINIMAX_API_KEY or enable NEXT_PUBLIC_DEMO_MODE=true for demo feedback.");
    return input.kind === "writing"
      ? mockWritingFeedback(input)
      : mockSpeakingFeedback(input);
  }

  const system = input.kind === "writing" ? WRITING_FEEDBACK_SYSTEM : SPEAKING_FEEDBACK_SYSTEM;
  const user =
    input.kind === "writing"
      ? WRITING_FEEDBACK_USER_TEMPLATE(input.taskType, input.prompt, input.text, input.wordCount)
      : SPEAKING_FEEDBACK_USER_TEMPLATE(input.part, input.prompt, input.transcript, input.transcriptConfidence, input.answerSeconds);
  const content = await postChat(provider, {
    model: provider.model,
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
  const provider = getChatProvider();
  if (!provider) {
    if (!MOCK_ALLOWED) throw new Error("Mistake classification is not configured. Add MINIMAX_API_KEY or enable NEXT_PUBLIC_DEMO_MODE=true for demo feedback.");
    const defaults: Record<ClassifierInput["skillScope"], MistakeCode> = {
      listening: "L4",
      reading: "R1",
      writing: "W1",
      speaking: "S2",
    };
    return {
      code: defaults[input.skillScope],
      confidence: "low",
      reason: "No AI provider key configured; returning demo classifier output.",
      reviewCard: {
        front: input.description.slice(0, 120),
        expectedAnswer: "Recurring pattern - review a similar exercise.",
        explanation: "Set MINIMAX_API_KEY to enable real-time mistake classification.",
      },
    };
  }

  const content = await postChat(provider, {
    model: provider.model,
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
  const apiKey = requireOpenAIApiKey();
  if (!apiKey) {
    if (!MOCK_ALLOWED) throw new Error("Speech transcription is not configured. Add OPENAI_API_KEY or enable NEXT_PUBLIC_DEMO_MODE=true for demo transcription.");
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
