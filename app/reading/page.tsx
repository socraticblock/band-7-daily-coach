"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PracticeModeGuide } from "@/components/ielts/PracticeModeGuide";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, MistakeCode, ReadingPayload, ReadingQuestion } from "@/lib/types";
import { useMistakes, useProfile, useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";
import { DISABLE_WRITING_ASSIST_PROPS } from "@/lib/input-assist";

export default function ReadingPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string> | null>(null);
  const [confirmCheckWithBlanks, setConfirmCheckWithBlanks] = useState(false);
  const [checked, setChecked] = useState(false);
  const [missionContentId, setMissionContentId] = useState<string | null>(null);
  const [invalidContentId, setInvalidContentId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [profile] = useProfile();
  const [mistakes, setMistakes] = useMistakes();
  const [, setUserContentState] = useUserContentState();

  useEffect(() => {
    const all = contentForSkill("reading");
    setItems(all);
    const requestedId = new URLSearchParams(window.location.search).get("contentId");
    if (requestedId) {
      const requested = getContentById(requestedId);
      if (!requested || requested.skill !== "reading") {
        setInvalidContentId(requestedId);
        return;
      }
      setMissionContentId(requestedId);
      setSelectedId(requestedId);
      return;
    }
    if (all.length > 0) setSelectedId((current) => current ?? all[0]!.id);
  }, []);

  const selected = typeof selectedId === "string" ? getContentById(selectedId) : undefined;
  const payload = selected?.payload as ReadingPayload | undefined;

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
          card.sourceSkill === "reading" &&
          card.sourceContentId === selected.id &&
          card.front === q.prompt &&
          card.expectedAnswer === q.answer
        );
        if (duplicate) continue;
        next.push({
          id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: profile.id,
          sourceSkill: "reading",
          sourceContentId: selected.id,
          code: readingMistakeCode(q, snapshot[q.id] ?? ""),
          front: q.prompt,
          expectedAnswer: q.answer,
          explanation: q.explanation,
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
        ? `Saved ${savedCount} reading mistake${savedCount === 1 ? "" : "s"} to Error Notebook.`
        : "Reading mistakes were already saved to Error Notebook.");
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
          <p className="label mb-3">Passages</p>
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
          {items.length <= 2 && (
            <p className="mt-3 text-tiny text-warn">
              V0.1 has {items.length} passages. V1 expands to 24-36.
            </p>
          )}
        </aside>

        <section className="space-y-5">
          {invalidContentId ? (
            <div className="card border-warn/40 bg-warn/5 p-5 text-small">
              <p className="font-medium text-warn">Mission item not found.</p>
              <p className="mt-2 text-ink-muted">This Reading mission item is unavailable or has the wrong skill type.</p>
              <Link href="/daily" className="mt-4 inline-flex btn-ghost btn-sm">Back to Daily</Link>
            </div>
          ) : !selected || !payload ? (
            <p className="text-small text-ink-muted">Pick a passage.</p>
          ) : (
            <>
              {missionContentId && (
                <div className="card border-accent/40 bg-accent/5 p-3 text-small text-accent">
                  Mission item
                </div>
              )}
              <PracticeModeGuide skill="reading" />
              <div>
                <p className="label">Reading</p>
                <h1 className="mt-1 font-serif text-title">{selected.title}</h1>
              </div>

              <div className="card p-5 sm:p-6">
                <p className="label">Passage</p>
                <p className="mt-2 whitespace-pre-line font-serif text-body leading-relaxed">
                  {payload.passage}
                </p>
              </div>

              <ol className="space-y-4">
                {payload.questions.map((q, i) => {
                  const answerOptions = answerOptionsForQuestion(q);
                  return (
                    <li key={q.id} className="card p-4">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-tiny text-ink-subtle">Q{i + 1}</span>
                        <p className="text-small">{q.prompt}</p>
                      </div>
                      {answerOptions ? (
                        <select
                          className="input mt-3 max-w-xs"
                          value={answers[q.id] ?? ""}
                          disabled={checked}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          aria-label={`Answer for question ${i + 1}`}
                        >
                          <option value="">Select answer</option>
                          {answerOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input mt-3"
                          placeholder="Your answer"
                          value={answers[q.id] ?? ""}
                          disabled={checked}
                          readOnly={checked}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          {...DISABLE_WRITING_ASSIST_PROPS}
                        />
                      )}
                      {checked && (
                        <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-small">
                          <div className={normalize(reviewAnswers[q.id] ?? "") === normalize(q.answer) ? "text-success" : "text-error"}>
                            {normalize(reviewAnswers[q.id] ?? "") === normalize(q.answer) ? "Correct" : `Correct answer: ${q.answer}`}
                          </div>
                          {q.evidenceQuote && (
                            <p className="text-tiny text-ink-subtle">
                              Evidence: “{q.evidenceQuote}”
                            </p>
                          )}
                          <p className="text-tiny text-ink-subtle">{q.explanation}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="flex items-center gap-3">
                <button onClick={checkAnswers} disabled={checked} className="btn-accent btn-sm">
                  Check answers
                </button>
                {checked && (
                  <span className="text-small text-ink-muted">
                    Score: {score} / {payload.questions.length}
                  </span>
                )}
              </div>

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
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function answerOptionsForQuestion(q: ReadingQuestion): string[] | null {
  if (q.type === "reading_true_false_not_given") {
    return ["True", "False", "Not Given"];
  }
  if (q.type === "reading_yes_no_not_given") {
    return ["Yes", "No", "Not Given"];
  }
  return q.options ?? null;
}

function readingMistakeCode(q: ReadingQuestion, userAnswer: string): MistakeCode {
  const correct = normalize(q.answer);
  const answer = normalize(userAnswer);
  const explanation = q.explanation.toLowerCase();
  if (q.type === "reading_true_false_not_given" && (correct === "not given" || answer === "not given")) return "R1";
  if (explanation.includes("paraphrase") || explanation.includes("synonym")) return "R3";
  if (
    q.type === "reading_matching_headings" ||
    q.type === "reading_matching_information" ||
    q.type === "reading_matching_features"
  ) return "R4";
  if (explanation.includes("evidence") || explanation.includes("not stated")) return "R5";
  return "R6";
}
