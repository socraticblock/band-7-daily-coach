// ============================================================================
// CLIENT-SIDE FEEDBACK
// Calls the real API routes. In explicit demo mode only, falls back to structured
// mocks so the UX can be tested without a backend/API key.
// ============================================================================

"use client";

import type { WritingFeedback, SpeakingFeedback } from "./types";
import { mockWritingFeedback, mockSpeakingFeedback, mockTranscribe, type WritingMockInput, type SpeakingMockInput } from "./feedback-mock";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function safeJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

function demoFallback<T>(fallback: () => T, originalError: unknown): T {
  if (DEMO_MODE) return fallback();
  throw originalError instanceof Error ? originalError : new Error("Request failed.");
}

export async function requestWritingFeedback(input: WritingMockInput): Promise<WritingFeedback> {
  try {
    const res = await fetch("/api/feedback/writing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await safeJson<WritingFeedback>(res);
  } catch (err) {
    return demoFallback(() => mockWritingFeedback(input), err);
  }
}

export async function requestSpeakingFeedback(input: SpeakingMockInput): Promise<SpeakingFeedback> {
  try {
    const res = await fetch("/api/feedback/speaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await safeJson<SpeakingFeedback>(res);
  } catch (err) {
    return demoFallback(() => mockSpeakingFeedback(input), err);
  }
}

export async function requestTranscription(audio: Blob): Promise<{ transcript: string; confidence: "high" | "medium" | "low"; isDemo?: boolean }> {
  try {
    const fd = new FormData();
    fd.append("audio", audio, "recording.webm");
    const res = await fetch("/api/speech/transcribe", { method: "POST", body: fd });
    return await safeJson<{ transcript: string; confidence: "high" | "medium" | "low"; isDemo?: boolean }>(res);
  } catch (err) {
    return demoFallback(() => mockTranscribe(), err);
  }
}
