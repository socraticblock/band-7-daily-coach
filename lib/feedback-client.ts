// ============================================================================
// CLIENT-SIDE FEEDBACK — used by pages in static-export demo mode.
// Tries the real API route first; falls back to a structured mock so the
// full UX is testable without a backend.
// ============================================================================

"use client";

import type { WritingFeedback, SpeakingFeedback } from "./types";
import { mockWritingFeedback, mockSpeakingFeedback, mockTranscribe, type WritingMockInput, type SpeakingMockInput } from "./feedback-mock";

async function safeJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

export async function requestWritingFeedback(input: WritingMockInput): Promise<WritingFeedback> {
  try {
    const res = await fetch("/api/feedback/writing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return await safeJson<WritingFeedback>(res);
  } catch {
    // Static export: no API route. Use the structured mock.
    return mockWritingFeedback(input);
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
  } catch {
    return mockSpeakingFeedback(input);
  }
}

export async function requestTranscription(audio: Blob): Promise<{ transcript: string; confidence: "high" | "medium" | "low" }> {
  try {
    const fd = new FormData();
    fd.append("audio", audio, "recording.webm");
    const res = await fetch("/api/speech/transcribe", { method: "POST", body: fd });
    return await safeJson<{ transcript: string; confidence: "high" | "medium" | "low" }>(res);
  } catch {
    return mockTranscribe();
  }
}
