"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AiDisclosureNotice } from "@/components/ui/AiDisclosureNotice";
import { PracticeModeGuide } from "@/components/ielts/PracticeModeGuide";
import { contentForSkill, getContentById } from "@/lib/content-loader";
import type { ContentItem, SpeakingPayload, SpeakingFeedback, MistakeCode } from "@/lib/types";
import { useAiDisclosureAccepted, useMistakes, useProfile, useSpeakingFeedback, useUserContentState, markContentAttempted, markContentStarted } from "@/lib/app-state";
import { detectRecordingCapabilities, recordOnce, type RecordingCapabilities } from "@/lib/audio-fallbacks";
import { bandRangeAverage, formatBandRange } from "@/lib/band-utils";
import { requestSpeakingFeedback, requestTranscription } from "@/lib/feedback-client";

const API_ERROR_MESSAGE =
  "Speaking feedback could not be generated. Your transcript was not lost. Please try again.";

export default function SpeakingPage() {
  const [prompts, setPrompts] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cap, setCap] = useState<RecordingCapabilities | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedDurationSeconds, setRecordedDurationSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptIsDemo, setTranscriptIsDemo] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
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

  const resetAttempt = () => {
    setAudioUrl(null);
    setTranscript("");
    setTranscriptIsDemo(false);
    setFeedback(null);
    setError(null);
    setRecordedDurationSeconds(0);
    setTranscribing(false);
    setGeneratingFeedback(false);
  };

  const transcribeAudio = async (blob: Blob, durationSeconds: number) => {
    setTranscribing(true);
    setError(null);
    setFeedback(null);
    setRecordedDurationSeconds(durationSeconds);
    try {
      const trJson = await requestTranscription(blob);
      setTranscript(trJson.transcript);
      setTranscriptIsDemo(trJson.isDemo === true);
    } catch {
      setError("Transcription failed. Please try recording or uploading again.");
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (!payload || !aiDisclosureAccepted) return;
    resetAttempt();
    setElapsed(0);
    setRecording(true);
    try {
      const result = await recordOnce(payload.speakingSeconds ?? 90, (e) => setElapsed(e));
      setRecording(false);
      const url = URL.createObjectURL(result.blob);
      setAudioUrl(url);
      await transcribeAudio(result.blob, result.durationSeconds);
    } catch (e) {
      setRecording(false);
      setError((e as Error).message);
    }
  };

  const handleUpload = async (file: File) => {
    if (!payload || !aiDisclosureAccepted) return;
    resetAttempt();
    setAudioUrl(URL.createObjectURL(file));
    await transcribeAudio(file, 0);
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

  const generateFeedbackFromTranscript = async () => {
    if (!payload || !selected?.id || !aiDisclosureAccepted) return;
    if (!transcript.trim()) {
      setError("Please record or upload an answer and review the transcript before generating feedback.");
      return;
    }

    setError(null);
    setFeedback(null);
    setGeneratingFeedback(true);

    try {
      const fbJson = await requestSpeakingFeedback({
        part: payload.part,
        prompt: payload.prompt,
        transcript,
        transcriptConfidence: transcriptIsDemo ? "low" : "medium",
        answerSeconds: recordedDurationSeconds,
      });
      setFeedback(fbJson);
      const estimatedScore = bandRangeAverage(fbJson.practiceBandRange);
      setUserContentState((current) =>
        markContentAttempted(current, selected.id, {
          ...(estimatedScore === null ? {} : { score: estimatedScore }),
          mastery: "attempted",
        }),
      );
      setHistory((h) => [...h, { ...fbJson }]);
      saveSpeakingMistakes(fbJson);
    } catch {
      setError(API_ERROR_MESSAGE);
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const busy = recording || transcribing || generatingFeedback;

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
                    resetAttempt();
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
              <PracticeModeGuide skill="speaking" />
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
                    <label className={`btn-ghost btn-sm ${aiDisclosureAccepted && !busy ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                      Upload audio file
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={!aiDisclosureAccepted || busy}
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
                      <button onClick={startRecording} className="btn-accent" disabled={busy || !aiDisclosureAccepted}>
                        Start recording
                      </button>
                    ) : (
                      <div className="text-small">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error" />
                        <span className="ml-2">Recording… {elapsed.toFixed(0)}s / {payload.speakingSeconds ?? 90}s</span>
                      </div>
                    )}
                    <span className="text-tiny text-ink-subtle">or</span>
                    <label className={`btn-ghost btn-sm ${aiDisclosureAccepted && !busy ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                      Upload audio file
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={!aiDisclosureAccepted || busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {transcribing && (
                <div className="card border-accent/30 bg-accent/5 p-4 text-small text-ink-muted">
                  <p className="font-medium text-ink">Transcribing your answer…</p>
                  <p className="mt-2 text-tiny text-ink-subtle">
                    Please wait while your speech is converted to text. You can review and correct it before generating feedback.
                  </p>
                </div>
              )}

              {audioUrl && (
                <div className="card p-4">
                  <p className="label mb-2">Your recording</p>
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}

              {transcript && !transcribing && (
                <div className="card p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="label">{feedback ? "Transcript used for feedback" : "Review your transcript"}</p>
                  </div>
                  {!feedback && (
                    <p className="mt-1 text-small text-ink-muted">
                      Correct any speech-to-text mistakes before generating feedback. Your feedback will be based on this transcript.
                    </p>
                  )}
                  <textarea
                    className="textarea mt-2 text-small"
                    value={transcript}
                    readOnly={generatingFeedback || Boolean(feedback)}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={5}
                  />
                  {feedback ? (
                    <p className="mt-1 text-tiny text-ink-subtle">
                      Feedback was generated from the transcript above. To change the transcript, record or upload again.
                    </p>
                  ) : (
                    <p className="mt-1 text-tiny text-ink-subtle">
                      Edit the transcript if speech-to-text misheard something.
                    </p>
                  )}
                  {transcriptIsDemo && (
                    <p className="mt-2 text-tiny text-warn">
                      Demo transcript - no real speech-to-text was used.
                    </p>
                  )}
                  {!feedback && (
                    <button
                      onClick={generateFeedbackFromTranscript}
                      disabled={generatingFeedback || !aiDisclosureAccepted}
                      className="btn-accent btn-sm mt-3"
                    >
                      {generatingFeedback ? "Reviewing your speaking answer…" : "Generate feedback from transcript"}
                    </button>
                  )}
                </div>
              )}

              {generatingFeedback && (
                <div className="card border-accent/30 bg-accent/5 p-4 text-small text-ink-muted">
                  <p className="font-medium text-ink">Reviewing your speaking answer…</p>
                  <p className="mt-2">
                    Your coach is checking fluency, vocabulary, grammar, and pronunciation clarity.
                    Pronunciation feedback is AI-estimated.
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
                    Speaking feedback ready. This is a practice estimate, not an official IELTS score.
                  </div>
                  <SpeakingFeedbackView fb={feedback} />
                </>
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SpeakingFeedbackView({ fb }: { fb: SpeakingFeedback }) {
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
