"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, ListeningPayload, ListeningQuestion } from "@/lib/types";
import { detectAudioCapabilities, type AudioPlaybackCapabilities } from "@/lib/audio-fallbacks";
import { useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";

export default function ListeningPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [checked, setChecked] = useState(false);
  const [cap, setCap] = useState<AudioPlaybackCapabilities | null>(null);
  const [missionContentId, setMissionContentId] = useState<string | null>(null);
  const [invalidContentId, setInvalidContentId] = useState<string | null>(null);
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
          <p className="label mb-3">Listening sets</p>
          <ul className="space-y-1.5">
            {items.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    if (missionContentId && p.id !== missionContentId) return;
                    setSelectedId(p.id);
                    setAnswers({});
                    setShowTranscript(false);
                    setChecked(false);
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
              V0.1 has {items.length} sets. V1 expands to 32-48.
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
              <div>
                <p className="label">Listening</p>
                <h1 className="mt-1 font-serif text-title">{selected.title}</h1>
                <p className="mt-2 text-small text-ink-muted">
                  {payload.questions.length} questions · {selected.estimatedMinutes} min
                </p>
              </div>

              <div className="card p-5">
                <p className="label">Audio</p>
                <p className="mt-2 text-tiny text-ink-subtle">
                  V0.1: audio is generated via TTS after the production pipeline. For now, the transcript is the script. Use the questions to practice locating answers in the text.
                </p>
                {cap && cap.recommendedAction === "tap_to_play" && (
                  <p className="mt-2 text-tiny text-ink-subtle">
                    On iOS, audio needs a tap to start. We&apos;ll use the official embedded player.
                  </p>
                )}
                <p className="mt-3 text-tiny text-ink-subtle">
                  <em>No audio file yet — TTS pipeline pending. Use the transcript to answer the questions.</em>
                </p>
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
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                    {checked && (
                      <AnswerReview q={q} userAnswer={answers[q.id] ?? ""} />
                    )}
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={checkAnswers} className="btn-accent btn-sm">
                  Check answers
                </button>
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="btn-ghost btn-sm"
                >
                  {showTranscript ? "Hide transcript" : "Show transcript"}
                </button>
                {checked && (
                  <span className="text-small text-ink-muted">
                    Score: {score} / {payload.questions.length}
                  </span>
                )}
              </div>

              {showTranscript && (
                <div className="card p-5 fade-in">
                  <p className="label">Transcript</p>
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
    </div>
  );
}

function normalize(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
