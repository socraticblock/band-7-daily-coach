"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AiDisclosureNotice } from "@/components/ui/AiDisclosureNotice";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, SpeakingPayload, SpeakingFeedback, MistakeCode } from "@/lib/types";
import { useAiDisclosureAccepted, useMistakes, useProfile, useSpeakingFeedback, useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";
import { detectRecordingCapabilities, recordOnce, type RecordingCapabilities } from "@/lib/audio-fallbacks";
import { BAND_NUMERIC } from "@/lib/types";
import { requestSpeakingFeedback, requestTranscription } from "@/lib/feedback-client";

export default function SpeakingPage() {
  const [prompts, setPrompts] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cap, setCap] = useState<RecordingCapabilities | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptIsDemo, setTranscriptIsDemo] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missionContentId, setMissionContentId] = useState<string | null>(null);
  const [invalidContentId, setInvalidContentId] = useState<string | null>(null);

  const [profile] = useProfile();
  const [, setMistakes] = useMistakes();
  const [, setHistory] = useSpeakingFeedback();
  const [, setUserContentState] = useUserContentState();
  const [aiDisclosureAccepted, setAiDisclosureAccepted] = useAiDisclosureAccepted();

  useEffect(() => {
    const all = contentForSkill("speaking");
    setPrompts(all);
    const requestedId = new URLSearchParams(window.location.search).get("contentId");
    if (requestedId) {
      const requested = getContentById(requestedId);
      if (!requested || requested.skill !== "speaking") {
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
    detectRecordingCapabilities().then(setCap);
  }, []);

  const selected = selectedId ? getContentById(selectedId) : undefined;
  const payload = selected?.payload as SpeakingPayload | undefined;

  useEffect(() => {
    if (!selectedId) return;
    setUserContentState((current) => markContentStarted(current, selectedId));
  }, [selectedId, setUserContentState]);

  const startRecording = async () => {
    if (!payload || !aiDisclosureAccepted) return;
    setError(null);
    setAudioUrl(null);
    setTranscript("");
    setTranscriptIsDemo(false);
    setFeedback(null);
    setElapsed(0);
    setRecording(true);
    try {
      const result = await recordOnce(payload.speakingSeconds ?? 90, (e) => setElapsed(e));
      setRecording(false);
      const url = URL.createObjectURL(result.blob);
      setAudioUrl(url);

      // Transcribe
      const trJson = await requestTranscription(result.blob);
      setTranscript(trJson.transcript);
      setTranscriptIsDemo(trJson.isDemo === true);

      // Feedback
      const fbJson = await requestSpeakingFeedback({
        part: payload.part,
        prompt: payload.prompt,
        transcript: trJson.transcript,
        transcriptConfidence: trJson.confidence,
        answerSeconds: result.durationSeconds,
      });
      setFeedback(fbJson);
      const estimatedScore = (BAND_NUMERIC[fbJson.practiceBandRange[0]] + BAND_NUMERIC[fbJson.practiceBandRange[1]]) / 2;
      if (selected?.id) {
        setUserContentState((current) =>
          markContentAttempted(current, selected.id, { score: estimatedScore, mastery: "attempted" }),
        );
      }
      setHistory((h) => [...h, { ...fbJson }]);
      saveSpeakingMistakes(fbJson);
    } catch (e) {
      setRecording(false);
      setError((e as Error).message);
    }
  };

  const handleUpload = async (file: File) => {
    if (!payload || !aiDisclosureAccepted) return;
    setError(null);
    setAudioUrl(URL.createObjectURL(file));
    setFeedback(null);
    setTranscript("");
    setTranscriptIsDemo(false);
    try {
      const trJson = await requestTranscription(file);
      setTranscript(trJson.transcript);
      setTranscriptIsDemo(trJson.isDemo === true);
      const fbJson = await requestSpeakingFeedback({
        part: payload.part,
        prompt: payload.prompt,
        transcript: trJson.transcript,
        transcriptConfidence: trJson.confidence,
        answerSeconds: 0,
      });
      setFeedback(fbJson);
      const estimatedScore = (BAND_NUMERIC[fbJson.practiceBandRange[0]] + BAND_NUMERIC[fbJson.practiceBandRange[1]]) / 2;
      if (selected?.id) {
        setUserContentState((current) =>
          markContentAttempted(current, selected.id, { score: estimatedScore, mastery: "attempted" }),
        );
      }
      setHistory((h) => [...h, { ...fbJson }]);
      saveSpeakingMistakes(fbJson);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveSpeakingMistakes = (fb: SpeakingFeedback) => {
    setMistakes((cards) => {
      const next = [...cards];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      for (const m of fb.savedMistakes) {
        const betterPhrase = fb.betterPhrases.find((p) =>
          p.original.trim().toLowerCase() === m.excerpt.trim().toLowerCase() ||
          m.excerpt.toLowerCase().includes(p.original.trim().toLowerCase())
        );
        const expectedAnswer = betterPhrase?.better ?? m.excerpt;
        const duplicate = next.some((card) =>
          card.sourceSkill === "speaking" &&
          card.sourceContentId === selected?.id &&
          card.front === m.excerpt &&
          card.expectedAnswer === expectedAnswer
        );
        if (duplicate) continue;
        next.push({
          id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: profile.id,
          sourceSkill: "speaking",
          sourceContentId: selected?.id,
          code: m.code as MistakeCode,
          front: m.excerpt,
          expectedAnswer,
          explanation: m.note,
          originalExcerpt: m.excerpt,
          improvedExcerpt: betterPhrase?.better,
          createdAt: new Date().toISOString(),
          reviewDueAt: tomorrow,
          reviewStage: 0,
          reviewCount: 0,
          mastered: false,
        });
      }
      return next;
    });
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
                    setAudioUrl(null);
                    setTranscript("");
                    setTranscriptIsDemo(false);
                    setFeedback(null);
                    setError(null);
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
                  <div className="font-medium">Part {p.title.match(/Part (\d)/)?.[1]}</div>
                  <div className="mt-0.5 line-clamp-2 text-tiny text-ink-muted">
                    {p.title.replace(/^Part \d: /, "")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-5">
          {invalidContentId ? (
            <div className="card border-warn/40 bg-warn/5 p-5 text-small">
              <p className="font-medium text-warn">Mission item not found.</p>
              <p className="mt-2 text-ink-muted">This Speaking mission item is unavailable or has the wrong skill type.</p>
              <Link href="/daily" className="mt-4 inline-flex btn-ghost btn-sm">Back to Daily</Link>
            </div>
          ) : !selected || !payload ? (
            <p className="text-small text-ink-muted">Pick a prompt.</p>
          ) : (
            <>
              {missionContentId && (
                <div className="card border-accent/40 bg-accent/5 p-3 text-small text-accent">
                  Mission item
                </div>
              )}
              <div>
                <p className="label">Part {payload.part}</p>
                <h1 className="mt-1 font-serif text-title">{selected.title}</h1>
                <p className="mt-3 text-body">{payload.prompt}</p>
                {payload.cueCardBullets && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-small text-ink-muted">
                    {payload.cueCardBullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {payload.prepSeconds && (
                  <p className="mt-2 text-tiny text-ink-subtle">
                    Preparation: {payload.prepSeconds}s · Speaking: {payload.speakingSeconds}s
                  </p>
                )}
              </div>

              <AiDisclosureNotice
                accepted={aiDisclosureAccepted}
                onAccept={() => setAiDisclosureAccepted(true)}
              />

              <div className="card p-5">
                {!cap && <p className="text-small text-ink-muted">Checking your microphone…</p>}
                {cap && !cap.supported && (
                  <div className="space-y-3 text-small">
                    <p className="text-warn">{cap.reason}</p>
                    <p className="text-ink-muted">
                      You can upload an audio file instead. Recording also works on most modern phones and laptops.
                    </p>
                    <label className={`btn-ghost btn-sm ${aiDisclosureAccepted ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                      Upload audio file
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={!aiDisclosureAccepted}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                        }}
                      />
                    </label>
                  </div>
                )}
                {cap && cap.supported && (
                  <div className="flex flex-wrap items-center gap-3">
                    {!recording ? (
                      <button onClick={startRecording} className="btn-accent" disabled={loading || !aiDisclosureAccepted}>
                        Start recording
                      </button>
                    ) : (
                      <div className="text-small">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error" />
                        <span className="ml-2">Recording… {elapsed.toFixed(0)}s / {payload.speakingSeconds ?? 90}s</span>
                      </div>
                    )}
                    <span className="text-tiny text-ink-subtle">or</span>
                    <label className={`btn-ghost btn-sm ${aiDisclosureAccepted ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                      Upload audio file
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={!aiDisclosureAccepted}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {audioUrl && (
                <div className="card p-4">
                  <p className="label mb-2">Your recording</p>
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}

              {transcript && (
                <div className="card p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="label">Transcript</p>
                    <p className="text-tiny text-ink-subtle">
                      AI confidence: {feedback?.transcriptConfidence ?? "—"}
                    </p>
                  </div>
                  <textarea
                    className="textarea mt-2 text-small"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={5}
                  />
                  <p className="mt-1 text-tiny text-ink-subtle">
                    Edit the transcript if Whisper misheard something. Feedback is based on what is shown above.
                  </p>
                  {transcriptIsDemo && (
                    <p className="mt-2 text-tiny text-warn">
                      Demo transcript - no real speech-to-text was used.
                    </p>
                  )}
                </div>
              )}

              {loading && <p className="text-small text-ink-muted">Generating feedback…</p>}

              {error && (
                <div className="card border-error/40 bg-error/5 p-4 text-small text-error">
                  {error}
                </div>
              )}

              {feedback && <SpeakingFeedbackView fb={feedback} />}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SpeakingFeedbackView({ fb }: { fb: SpeakingFeedback }) {
  const [low, high] = fb.practiceBandRange;
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
          Band {BAND_NUMERIC[low].toFixed(1)} – {BAND_NUMERIC[high].toFixed(1)}
        </div>
        <p className="mt-1 text-tiny text-ink-subtle">
          Estimate only. Pronunciation is an AI estimate, not examiner-grade.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["fluencyCoherence", "Fluency and Coherence"],
          ["lexicalResource", "Lexical Resource"],
          ["grammaticalRange", "Grammatical Range and Accuracy"],
          ["pronunciationEstimate", "Pronunciation (AI estimate)"],
        ] as const).map(([k, label]) => {
          const v = (fb as unknown as Record<string, { score: number; comment: string }>)[k];
          if (!v) return null;
          return (
            <div key={k} className="card p-5">
              <p className="label">{label}</p>
              <div className="mt-1 text-subtitle font-semibold">{v.score} / 9</div>
              <p className="mt-2 text-small text-ink-muted">{v.comment}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <p className="label">Top habits to fix</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-small">
          {fb.topHabits.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>

      {fb.betterPhrases.length > 0 && (
        <div className="card p-5">
          <p className="label">Better phrases</p>
          <ul className="mt-2 space-y-2 text-small">
            {fb.betterPhrases.map((p, i) => (
              <li key={i}>
                <div className="text-ink-muted">“{p.original}”</div>
                <div>→ {p.better}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
