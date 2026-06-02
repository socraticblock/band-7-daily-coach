"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useMistakes } from "@/lib/app-state";
import { applyMark, isDue, pickDailyReviewQueue } from "@/lib/spaced-repetition";
import { MISTAKE_TAXONOMY } from "@/lib/mistake-taxonomy";
import type { MistakeCard, ReviewMark } from "@/lib/types";

export default function MistakesPage() {
  const [mistakes, setMistakes] = useMistakes();
  const [active, setActive] = useState<MistakeCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [recall, setRecall] = useState("");

  const today = new Date();
  const due = useMemo(() => pickDailyReviewQueue(mistakes, 8, today), [mistakes, today]);
  const allDue = useMemo(() => mistakes.filter((m) => isDue(m, today)), [mistakes, today]);
  const queueOverflow = Math.max(0, allDue.length - due.length);
  const mastered = mistakes.filter((m) => m.mastered).length;

  const onMark = (card: MistakeCard, mark: ReviewMark) => {
    if (mark === "mastered" && recall.trim().length < 3) {
      // Require some active engagement
      alert("To mark Mastered, type the corrected answer first.");
      return;
    }
    const updated = applyMark(card, mark, today);
    setMistakes(mistakes.map((m) => (m.id === card.id ? updated : m)));
    setActive(null);
    setRevealed(false);
    setRecall("");
  };

  if (active) {
    const meta = MISTAKE_TAXONOMY[active.code];
    return (
      <AppShell>
        <div className="mx-auto max-w-reading">
          <button
            onClick={() => { setActive(null); setRevealed(false); setRecall(""); }}
            className="mb-4 text-tiny text-ink-muted hover:text-ink"
          >
            ← Back to notebook
          </button>
          <div className="card p-6 sm:p-8">
            <p className="label">Review card · {active.code} · {meta.label}</p>
            <h1 className="mt-2 font-serif text-subtitle">{active.front}</h1>

            <div className="mt-5">
              <p className="label">Your attempt</p>
              <textarea
                className="textarea mt-2 text-small"
                rows={3}
                placeholder="Type the corrected sentence or your answer."
                value={recall}
                onChange={(e) => setRecall(e.target.value)}
              />
            </div>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="btn-accent mt-4"
                disabled={recall.trim().length === 0}
              >
                Reveal answer
              </button>
            ) : (
              <div className="mt-5 space-y-3 fade-in">
                <div>
                  <p className="label">Expected</p>
                  <p className="mt-1 text-body">{active.expectedAnswer}</p>
                </div>
                <div>
                  <p className="label">Explanation</p>
                  <p className="mt-1 text-small text-ink-muted">{active.explanation}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <button onClick={() => onMark(active, "again")} className="btn-ghost btn-sm">
                    Again (1 day)
                  </button>
                  <button onClick={() => onMark(active, "almost")} className="btn-ghost btn-sm">
                    Almost (3 days)
                  </button>
                  <button onClick={() => onMark(active, "mastered")} className="btn-accent btn-sm">
                    Mastered (7-14 days)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Error Notebook</p>
        <h1 className="mt-1 font-serif text-title">Active recall, not a list.</h1>
        <p className="mt-2 text-small text-ink-muted">
          {due.length} due today · {queueOverflow > 0 ? `${queueOverflow} more waiting` : "queue clear"} · {mastered} mastered total
        </p>
      </div>

      {due.length === 0 ? (
        <div className="card p-6 text-small text-ink-muted">
          Nothing due right now. Submit a Writing or Speaking response to add mistakes here.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {due.map((m) => {
            const meta = MISTAKE_TAXONOMY[m.code];
            return (
              <li key={m.id}>
                <button
                  onClick={() => { setActive(m); setRevealed(false); setRecall(""); }}
                  className="card w-full p-4 text-left transition-colors hover:border-ink-subtle"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="pill shrink-0">{m.code} · {meta.label}</span>
                    <span className="text-tiny text-ink-subtle">stage {m.reviewStage} · {m.reviewCount} reviews</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-small">{m.front}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {mistakes.length > due.length && (
        <div className="mt-10">
          <h2 className="text-subtitle font-semibold">All mistakes</h2>
          <ul className="mt-3 card divide-y divide-line">
            {mistakes
              .filter((m) => !due.find((d) => d.id === m.id))
              .map((m) => {
                const meta = MISTAKE_TAXONOMY[m.code];
                return (
                  <li key={m.id} className="flex items-center gap-3 p-4 text-small">
                    <span className="pill shrink-0">{m.code}</span>
                    <span className="line-clamp-1 flex-1">{m.front}</span>
                    <span className="text-tiny text-ink-subtle">
                      {m.mastered ? "mastered" : `due ${m.reviewDueAt}`}
                    </span>
                    <span className="text-tiny text-ink-subtle">{meta.label}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
