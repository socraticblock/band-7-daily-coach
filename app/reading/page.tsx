"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, ReadingPayload, ReadingQuestion } from "@/lib/types";
import { useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";

export default function ReadingPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [, setUserContentState] = useUserContentState();

  useEffect(() => {
    setItems(contentForSkill("reading"));
  }, []);
  useEffect(() => {
    if (items.length > 0 && !selectedId) setSelectedId(items[0]!.id);
  }, [items, selectedId]);

  const selected = typeof selectedId === "string" ? getContentById(selectedId) : undefined;
  const payload = selected?.payload as ReadingPayload | undefined;

  useEffect(() => {
    if (!selectedId) return;
    setUserContentState((current) => markContentStarted(current, selectedId));
  }, [selectedId, setUserContentState]);

  const score = payload?.questions.reduce(
    (acc, q) => (normalize(answers[q.id]) === normalize(q.answer) ? acc + 1 : acc),
    0,
  ) ?? 0;

  const checkAnswers = () => {
    if (selected && payload && !checked) {
      setUserContentState((current) =>
        markContentAttempted(current, selected.id, {
          score: payload.questions.length > 0 ? score / payload.questions.length : 0,
          receptiveMastery: true,
        }),
      );
    }
    setChecked(true);
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
                  onClick={() => { setSelectedId(p.id); setAnswers({}); setChecked(false); }}
                  className={`w-full rounded border px-3 py-2 text-left text-small transition-colors ${
                    selectedId === p.id ? "border-ink bg-paper-warm" : "border-line bg-paper-card hover:border-ink-subtle"
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
          {!selected || !payload ? (
            <p className="text-small text-ink-muted">Pick a passage.</p>
          ) : (
            <>
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
                {payload.questions.map((q, i) => (
                  <li key={q.id} className="card p-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-tiny text-ink-subtle">Q{i + 1}</span>
                      <p className="text-small">{q.prompt}</p>
                    </div>
                    {q.options ? (
                      <div className="mt-3 grid gap-1.5">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-small">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="input mt-3"
                        placeholder="Your answer"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                    {checked && (
                      <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-small">
                        <div className={normalize(answers[q.id] ?? "") === normalize(q.answer) ? "text-success" : "text-error"}>
                          {normalize(answers[q.id] ?? "") === normalize(q.answer) ? "Correct" : `Correct answer: ${q.answer}`}
                        </div>
                        <p className="text-tiny text-ink-subtle">{q.explanation}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-3">
                <button onClick={checkAnswers} className="btn-accent btn-sm">
                  Check answers
                </button>
                {checked && (
                  <span className="text-small text-ink-muted">
                    Score: {score} / {payload.questions.length}
                  </span>
                )}
              </div>
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
