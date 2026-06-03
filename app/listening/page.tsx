"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PracticeModeGuide } from "@/components/ielts/PracticeModeGuide";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, ListeningPayload, ListeningQuestion, MistakeCode } from "@/lib/types";
import { detectAudioCapabilities, type AudioPlaybackCapabilities } from "@/lib/audio-fallbacks";
import { useMistakes, useProfile, useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";

export default function ListeningPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string> | null>(null);
  const [confirmCheckWithBlanks, setConfirmCheckWithBlanks] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [checked, setChecked] = useState(false);
  const [cap, setCap] = useState<AudioPlaybackCapabilities | null>(null);
  const [missionContentId, setMissionContentId] = useState<string | null>(null);
  const [invalidContentId, setInvalidContentId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [profile] = useProfile();
  const [mistakes, setMistakes] = useMistakes();
  const [, setUserContentState] = useUserContentState();

  useEffect(() => {
    const all = contentForSkill("listening");
    setItems(all);
    const requestedId = new URLSearchParams(window.location.search).get("contentId");
    if (requestedId) {
      const requested = getContentById(requestedId);
      if (!requested || requested.skill !== "listening") {
        setInvalidContentId(requestedId);
        return;
      }
      setMissionContentId(requestedId);
      setSelectedId(requestedId);
      return;
    }
    if (all.length > 0) setSelectedId((current) => current ?? all[0]!.id);
  }, []);

  useEffect(() => {
    setCap(detectAudioCapabilities());
  }, []);

  const selected = typeof selectedId === "string" ? getContentById(selectedId) : undefined;
  const payload = selected?.payload as ListeningPayload | undefined;
  const hasAudio = Boolean(payload?.audioUrl);

  useEffect(() => {
    if (!selectedId) return;
    setUserContentState((current) => markContentStarted(current, selectedId));
  }, [selectedId, setUserContentState]);

  const reviewAnswers = submittedAnswers ?? answers;

  const score = payload?.questions.reduce(
    (acc, q) => (normalize(reviewAnswers[q.id]) === normalize(q.answer) ? acc + 1 : acc),
    0,
  ) ?? 0;

  const performCheck = () => {
    if (!selected || !payload || checked) return;
    const snapshot = { ...answers };
    setSubmittedAnswers(snapshot);
    setConfirmCheckWithBlanks(false);

    const computedScore = payload.questions.reduce(
      (acc, q) => (normalize(snapshot[q.id]) === normalize(q.answer) ? acc + 1 : acc),
      0,
    );

    setUserContentState((current) =>
      markContentAttempted(current, selected.id, {
        score: payload.questions.length > 0 ? computedScore / payload.questions.length : 0,
        receptiveMastery: true,
      }),
    );
    const wrongQuestions = payload.questions.filter((q) => normalize(snapshot[q.id]) !== normalize(q.answer));
    if (wrongQuestions.length > 0) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const next = [...mistakes];
      for (const q of wrongQuestions) {
        const duplicate = next.some((card) =>
          card.sourceSkill === "listening" &&
          card.sourceContentId === selected.id &&
          card.front === q.prompt &&
          card.expectedAnswer === q.answer
        );
        if (duplicate) continue;
        next.push({
          id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: profile.id,
          sourceSkill: "listening",
          sourceContentId: selected.id,
          code: listeningMistakeCode(q, snapshot[q.id] ?? ""),
          front: q.prompt,
          expectedAnswer: q.answer,
          explanation: listeningExplanation(q),
          createdAt: new Date().toISOString(),
          reviewDueAt: tomorrow,
          reviewStage: 0,
          reviewCount: 0,
          mastered: false,
        });
      }
      const savedCount = next.length - mistakes.length;
      setMistakes(next);
      setSavedMessage(savedCount > 0
        ? `Saved ${savedCount} listening mistake${savedCount === 1 ? "" : "s"} to Error Notebook.`
        : "Listening mistakes were already saved to Error Notebook.");
    } else {
      setSavedMessage(null);
    }
    setChecked(true);
  };

  const checkAnswers = () => {
    if (checked || !payload) return;
    const unansweredCount = payload.questions.filter((q) => !answers[q.id]?.trim()).length;
    if (unansweredCount > 0 && !confirmCheckWithBlanks) {
      setConfirmCheckWithBlanks(true);
      return;
    }
    performCheck();
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <p className="label mb-3">Listening sets</p>
          <ul className="space-y-1.5">
            {items.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    if (missionContentId && p.id !== missionContentId) return;
                    setSelectedId(p.id);
                    setAnswers({});
                    setSubmittedAnswers(null);
                    setConfirmCheckWithBlanks(false);
                    setShowTranscript(false);
                    setChecked(false);
                    setSavedMessage(null);
                  }}
                  disabled={missionContentId !== null && p.id !== missionContentId}
                  className={`w-full rounded border px-3 py-2 text-left text-small transition-colors ${
                    selectedId === p.id
                      ? "border-ink bg-paper-warm"
                      : missionContentId !== null && p.id !== missionContentId
                        ? "cursor-not-allowed border-line bg-paper-card opacity-50"
                        : "border-line bg-paper-card hover:border-ink-subtle"
                  }`}
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="mt-0.5 text-tiny text-ink-subtle">
                    {p.estimatedMinutes} min · {p.difficulty.replace("band", "B")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {items.length < 32 && (
            <p className="mt-3 text-tiny text-warn">
              V0.1 has {items.length} sets. V1 expands to 32+.
            </p>
          )}
        </aside>

        <section className="space-y-5">
          {invalidContentId ? (
            <div className="card border-warn/40 bg-warn/5 p-5 text-small">
              <p className="font-medium text-warn">Mission item not found.</p>
              <p className="mt-2 text-ink-muted">This Listening mission item is unavailable or has the wrong skill type.</p>
              <Link href="/daily" className="mt-4 inline-flex btn-ghost btn-sm">Back to Daily</Link>
            </div>
          ) : !selected || !payload ? (
            <p className="text-small text-ink-muted">Pick a listening set.</p>
          ) : (
            <>
              {missionContentId && (
                <div className="card border-accent/40 bg-accent/5 p-3 text-small text-accent">
                  Mission item
                </div>
              )}
              <PracticeModeGuide skill="listening" />
              <div>
                <p className="label">Listening</p>
                <h1 className="mt-1 font-serif text-title">{selected.title}</h1>
                <p className="mt-2 text-small text-ink-muted">
                  {payload.questions.length} questions · {selected.estimatedMinutes} min
                </p>
              </div>

              <div className="card p-5">
                <p className="label">Audio</p>
                {hasAudio ? (
                  <>
                    <audio src={payload.audioUrl} controls className="mt-3 w-full" preload="metadata" />
                    <p className="mt-2 text-tiny text-ink-subtle">
                      Practice tip: try the audio once first. Then replay only during review.
                    </p>
                    {cap && cap.recommendedAction === "tap_to_play" && (
                      <p className="mt-2 text-tiny text-ink-subtle">
                        On iOS, audio needs a tap to start.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-3 rounded border border-warn/40 bg-warn/5 p-3 text-small text-warn">
                    Audio is not available for this prototype item yet.
                  </div>
                )}
              </div>

              <ol className="space-y-4">
                {payload.questions.map((q, i) => (
                  <li key={q.id} className="card p-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-tiny text-ink-subtle">Q{i + 1}</span>
                      <p className="text-small whitespace-pre-line">{q.prompt}</p>
                    </div>
                    {q.options && (
                      <div className="mt-3 grid gap-1.5">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-small">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              disabled={checked}
                              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {!q.options && (
                      <input
                        type="text"
                        className="input mt-3"
                        placeholder="Your answer"
                        value={answers[q.id] ?? ""}
                        disabled={checked}
                        readOnly={checked}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                    {checked && (
                      <AnswerReview q={q} userAnswer={reviewAnswers[q.id] ?? ""} />
                    )}
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={checkAnswers} disabled={checked} className="btn-accent btn-sm">
                  Check answers
                </button>
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="btn-ghost btn-sm"
                  disabled={!checked}
                >
                  {showTranscript ? "Hide transcript" : "Review transcript"}
                </button>
                {checked && (
                  <span className="text-small text-ink-muted">
                    Score: {score} / {payload.questions.length}
                  </span>
                )}
              </div>

              {!checked && (
                <p className="text-tiny text-ink-subtle">
                  Transcript is hidden during the attempt, like the real exam. Use it only after checking your answers.
                </p>
              )}

              {confirmCheckWithBlanks && !checked && payload && (
                <div className="card border-warn/40 bg-warn/5 p-4 text-small">
                  <p className="text-warn">
                    You still have {payload.questions.filter((q) => !answers[q.id]?.trim()).length} unanswered question{payload.questions.filter((q) => !answers[q.id]?.trim()).length === 1 ? "" : "s"}. Check anyway?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button onClick={performCheck} className="btn-accent btn-sm">
                      Check anyway
                    </button>
                    <button onClick={() => setConfirmCheckWithBlanks(false)} className="btn-ghost btn-sm">
                      Keep answering
                    </button>
                  </div>
                </div>
              )}

              {savedMessage && (
                <div className="card border-success/40 bg-success/5 p-4 text-small text-success">
                  {savedMessage}
                </div>
              )}

              {showTranscript && (
                <div className="card p-5 fade-in">
                  <p className="label">Transcript</p>
                  <p className="mt-1 text-tiny text-ink-subtle">
                    Transcript is hidden during the attempt, like the real exam. Use it only after checking your answers.
                  </p>
                  <p className="mt-2 whitespace-pre-line font-serif text-small leading-relaxed text-ink-muted">
                    {payload.transcript}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function AnswerReview({ q, userAnswer }: { q: ListeningQuestion; userAnswer: string }) {
  const correct = normalize(userAnswer) === normalize(q.answer);
  return (
    <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-small">
      <div className={correct ? "text-success" : "text-error"}>
        {correct ? "Correct" : `Correct answer: ${q.answer}`}
      </div>
      {q.distractorNote && (
        <p className="text-tiny text-ink-subtle">Note: {q.distractorNote}</p>
      )}
      {q.explanation && (
        <p className="text-tiny text-ink-subtle">Explanation: {q.explanation}</p>
      )}
    </div>
  );
}

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function listeningMistakeCode(q: ListeningQuestion, userAnswer: string): MistakeCode {
  const answer = normalize(userAnswer);
  const correct = normalize(q.answer);
  const combined = `${q.prompt} ${q.distractorNote ?? ""} ${q.explanation ?? ""}`.toLowerCase();
  if (isNearSpelling(answer, correct)) return "L1";
  if (/\d/.test(q.answer) && answer !== correct) return "L2";
  if (q.distractorNote) return "L4";
  if (combined.includes("paraphrase") || combined.includes("synonym")) return "L5";
  return "L6";
}

function listeningExplanation(q: ListeningQuestion): string {
  return [
    q.evidenceTimestamp ? `Evidence timestamp: ${q.evidenceTimestamp}.` : "",
    q.explanation ?? (q.distractorNote ? `Note: ${q.distractorNote}` : "Review the answer wording carefully."),
  ].filter(Boolean).join(" ");
}

function isNearSpelling(answer: string, correct: string): boolean {
  const a = answer.replace(/[^a-z]/g, "");
  const b = correct.replace(/[^a-z]/g, "");
  if (a.length < 4 || b.length < 4) return false;
  if (a === b) return false;
  return levenshtein(a, b) <= 2;
}

function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < b.length; j += 1) {
      current[j + 1] = Math.min(
        current[j]! + 1,
        previous[j + 1]! + 1,
        previous[j]! + (a[i] === b[j] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] ?? 0;
}
