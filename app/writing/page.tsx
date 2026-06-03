"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AiDisclosureNotice } from "@/components/ui/AiDisclosureNotice";
import { PracticeModeGuide } from "@/components/ielts/PracticeModeGuide";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, WritingPayload, WritingFeedback, MistakeCode } from "@/lib/types";
import { useAiDisclosureAccepted, useProfile, useMistakes, useWritingFeedback, useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";
import { bandRangeAverage, formatBandRange } from "@/lib/band-utils";
import { requestWritingFeedback } from "@/lib/feedback-client";
import { validateWritingResponseQuality } from "@/lib/writing-response-quality";

const API_ERROR_MESSAGE =
  "Feedback could not be generated. Your writing was not lost. Please try again in a moment.";

export default function WritingPage() {
  const [prompts, setPrompts] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missionContentId, setMissionContentId] = useState<string | null>(null);
  const [invalidContentId, setInvalidContentId] = useState<string | null>(null);

  const [profile] = useProfile();
  const [, setMistakes] = useMistakes();
  const [, setHistory] = useWritingFeedback();
  const [, setUserContentState] = useUserContentState();
  const [aiDisclosureAccepted, setAiDisclosureAccepted] = useAiDisclosureAccepted();

  useEffect(() => {
    const all = contentForSkill("writing");
    setPrompts(all);
    const requestedId = new URLSearchParams(window.location.search).get("contentId");
    if (requestedId) {
      const requested = getContentById(requestedId);
      if (!requested || requested.skill !== "writing") {
        setInvalidContentId(requestedId);
        return;
      }
      setMissionContentId(requestedId);
      setSelectedId(requestedId);
      return;
    }
    if (all.length > 0) setSelectedId((current) => current ?? all[0]!.id);
  }, []);

  const selected = selectedId ? getContentById(selectedId) : undefined;
  const payload = selected?.payload as WritingPayload | undefined;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  useEffect(() => {
    if (!selectedId) return;
    setUserContentState((current) => markContentStarted(current, selectedId));
  }, [selectedId, setUserContentState]);

  const submit = async () => {
    if (!selected || !payload || !aiDisclosureAccepted) return;

    const quality = validateWritingResponseQuality(text);
    if (!quality.ok) {
      setError(quality.message);
      setFeedback(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await requestWritingFeedback({
        taskType: payload.taskType,
        prompt: payload.prompt,
        text,
        wordCount,
      });
      setFeedback(data);
      const estimatedScore = bandRangeAverage(data.practiceBandRange);
      setUserContentState((current) =>
        markContentAttempted(current, selected.id, {
          ...(estimatedScore === null ? {} : { score: estimatedScore }),
          mastery: "attempted",
        }),
      );
      // Save feedback history
      setHistory((h) => [...h, { ...data }]);
      // Convert top mistakes to error notebook
      setMistakes((cards) => {
        const next = [...cards];
        const seenExcerpts = new Set<string>();
        const usableMistakes = data.savedMistakes.filter((m) => {
          const excerptKey = m.excerpt.trim().toLowerCase();
          if (!excerptKey || !m.improvedExcerpt?.trim()) return false;
          if (seenExcerpts.has(excerptKey)) return false;
          seenExcerpts.add(excerptKey);
          return true;
        });
        for (const m of usableMistakes) {
          next.push({
            id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: profile.id,
            sourceSkill: "writing",
            sourceContentId: selected.id,
            code: m.code as MistakeCode,
            front: m.excerpt,
            expectedAnswer: m.improvedExcerpt,
            explanation: m.note,
            originalExcerpt: m.excerpt,
            improvedExcerpt: m.improvedExcerpt,
            createdAt: new Date().toISOString(),
            reviewDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            reviewStage: 0,
            reviewCount: 0,
            mastered: false,
          });
        }
        return next;
      });
    } catch {
      setError(API_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <p className="label mb-3">Prompts</p>
          <ul className="space-y-1.5">
            {prompts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    if (missionContentId && p.id !== missionContentId) return;
                    setSelectedId(p.id);
                    setText("");
                    setFeedback(null);
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
        </aside>

        <section>
          {invalidContentId ? (
            <div className="card border-warn/40 bg-warn/5 p-5 text-small">
              <p className="font-medium text-warn">Mission item not found.</p>
              <p className="mt-2 text-ink-muted">This Writing mission item is unavailable or has the wrong skill type.</p>
              <Link href="/daily" className="mt-4 inline-flex btn-ghost btn-sm">Back to Daily</Link>
            </div>
          ) : !selected || !payload ? (
            <p className="text-small text-ink-muted">Pick a prompt to start.</p>
          ) : (
            <div className="space-y-5">
              {missionContentId && (
                <div className="card border-accent/40 bg-accent/5 p-3 text-small text-accent">
                  Mission item
                </div>
              )}
              <PracticeModeGuide skill="writing" />
              <div>
                <p className="label">Prompt</p>
                <h1 className="mt-1 font-serif text-title">{selected.title}</h1>
                <p className="mt-3 text-body">{payload.prompt}</p>
                {payload.minimumWords && (
                  <>
                    <p className="mt-2 text-tiny text-ink-subtle">
                      Minimum words: {payload.minimumWords}
                    </p>
                    <p className="mt-1 text-tiny text-ink-subtle">
                      In IELTS, answers below the minimum word count are penalised. You can still practise, but a full answer gives better feedback.
                    </p>
                  </>
                )}
                {payload.planningHints && payload.planningHints.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-tiny text-ink-muted">Planning hints</summary>
                    <ul className="mt-2 list-disc pl-5 text-small text-ink-muted">
                      {payload.planningHints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="editor" className="label">Your response</label>
                  <div className="text-tiny text-ink-subtle">{wordCount} words</div>
                </div>
                <textarea
                  id="editor"
                  className="textarea mt-2 font-serif text-body"
                  placeholder="Type your response here. Take your time."
                  value={text}
                  readOnly={loading}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={submit} disabled={loading || text.trim().length < 5 || !aiDisclosureAccepted} className="btn-accent">
                  {loading ? "Reviewing your answer…" : "Submit for feedback"}
                </button>
                {payload.minimumWords && wordCount < payload.minimumWords && (
                  <span className="text-tiny text-warn">
                    Below minimum word count ({payload.minimumWords}).
                  </span>
                )}
              </div>

              <AiDisclosureNotice
                accepted={aiDisclosureAccepted}
                onAccept={() => setAiDisclosureAccepted(true)}
              />

              {loading && (
                <div className="card border-accent/30 bg-accent/5 p-4 text-small text-ink-muted">
                  <p className="font-medium text-ink">Reviewing your answer…</p>
                  <p className="mt-2">
                    Your coach is checking task response, structure, vocabulary, grammar,
                    and practical mistakes for your Error Notebook.
                  </p>
                  <p className="mt-2 text-tiny text-ink-subtle">
                    This usually takes 20–60 seconds. Please keep this tab open.
                  </p>
                </div>
              )}

              {error && (
                <div className="card border-error/40 bg-error/5 p-4 text-small text-error">
                  {error}
                </div>
              )}

              {feedback && (
                <>
                  <div className="card border-success/40 bg-success/5 p-4 text-small text-success">
                    Feedback ready. This is a practice estimate, not an official IELTS score.
                  </div>
                  <WritingFeedbackView fb={feedback} />
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function WritingFeedbackView({ fb }: { fb: WritingFeedback }) {
  return (
    <div className="space-y-4 fade-in">
      {fb.isDemo && (
        <div className="card border-warn/40 bg-warn/5 p-4 text-small text-warn">
          Demo feedback - this is not real AI feedback. Set MINIMAX_API_KEY for real feedback.
        </div>
      )}
      <div className="card p-5">
        <p className="label">Practice band estimate</p>
        <div className="mt-1 text-subtitle font-semibold">
          {formatBandRange(fb.practiceBandRange)}
        </div>
        <p className="mt-1 text-tiny text-ink-subtle">
          Estimate only. Not an official IELTS score.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(fb.criteria).map(([k, v]) => (
          <div key={k} className="card p-5">
            <p className="label">{labelForCriterion(k)}</p>
            <div className="mt-1 text-subtitle font-semibold">{v.score} / 9</div>
            <p className="mt-2 text-small text-ink-muted">{v.comment}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <p className="label">Top fixes</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-small">
          {fb.topFixes.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ol>
      </div>

      {fb.beforeAfter.length > 0 && (
        <div className="card p-5">
          <p className="label">Before / after</p>
          <div className="mt-3 space-y-3">
            {fb.beforeAfter.map((b, i) => (
              <div key={i} className="space-y-1.5 text-small">
                <div>
                  <span className="label mr-2">Original</span>
                  <span className="text-ink-muted">{b.before}</span>
                </div>
                <div>
                  <span className="label mr-2">Improved</span>
                  <span>{b.after}</span>
                </div>
                <p className="text-tiny text-ink-subtle">{b.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <p className="label">Saved to Error Notebook</p>
        {fb.savedMistakes.length === 0 ? (
          <p className="mt-2 text-small text-ink-muted">No new mistakes saved.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-small">
            {fb.savedMistakes.map((m, i) => (
              <li key={i} className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
                <span className="pill shrink-0">{m.code}</span>
                <span className="text-ink-muted">{m.excerpt}</span>
                <span className="hidden sm:block" />
                <span>{m.improvedExcerpt}</span>
                <span className="hidden sm:block" />
                <span className="text-tiny text-ink-subtle">{m.note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function labelForCriterion(k: string): string {
  switch (k) {
    case "taskResponse": return "Task Response / Achievement";
    case "coherenceCohesion": return "Coherence and Cohesion";
    case "lexicalResource": return "Lexical Resource";
    case "grammaticalRange": return "Grammatical Range and Accuracy";
    default: return k;
  }
}
