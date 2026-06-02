"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useMistakes, useMissions, useProfile, useStats, useWritingFeedback, useSpeakingFeedback } from "@/lib/app-state";
import { BAND_NUMERIC } from "@/lib/types";

export default function ProgressPage() {
  const [profile] = useProfile();
  const [mistakes] = useMistakes();
  const [missions] = useMissions();
  const [stats] = useStats();
  const [writingFB] = useWritingFeedback();
  const [speakingFB] = useSpeakingFeedback();

  const completedMissions = missions.filter((m) => m.status === "completed").length;
  const partialMissions = missions.filter((m) => m.status === "partially_completed").length;
  const mastery = mistakes.filter((m) => m.mastered).length;
  const totalMin = stats.reduce((s, x) => s + (x.minutesStudied ?? x.totalMinutes), 0);
  const tasksCompleted = stats.reduce((s, x) => s + (x.tasksCompleted ?? 0), 0);
  const tasksSkipped = stats.reduce((s, x) => s + (x.tasksSkipped ?? 0), 0);
  const mistakesSaved = stats.reduce((s, x) => s + x.mistakesSaved, 0);
  const mistakesReviewed = stats.reduce((s, x) => s + x.mistakesReviewed, 0);

  const writingBands = writingFB.map((f) => f.practiceBandRange);
  const speakingBands = speakingFB.map((f) => f.practiceBandRange);

  const lastWriting = writingFB[writingFB.length - 1];
  const lastSpeaking = speakingFB[speakingFB.length - 1];

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Progress</p>
        <h1 className="mt-1 font-serif text-title">Practice readiness.</h1>
        <p className="mt-2 text-small text-ink-muted">
          Practice band estimates are not official IELTS scores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Full missions" value={completedMissions.toString()} sub={`${partialMissions} partial`} />
        <Stat label="Streak" value={`${profile.streakDays} day${profile.streakDays === 1 ? "" : "s"}`} sub={`Longest ${profile.longestStreak}`} />
        <Stat label="Total study time" value={`${totalMin} min`} />
        <Stat label="Mistakes mastered" value={mastery.toString()} sub={`${mistakes.length - mastery} still in rotation`} />
        <Stat label="Tasks completed" value={tasksCompleted.toString()} />
        <Stat label="Tasks skipped" value={tasksSkipped.toString()} />
        <Stat label="Mistakes saved" value={mistakesSaved.toString()} />
        <Stat label="Mistakes reviewed" value={mistakesReviewed.toString()} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="label">Writing readiness</p>
          {lastWriting ? (
            <>
              <div className="mt-1 text-subtitle font-semibold">
                Band {BAND_NUMERIC[lastWriting.practiceBandRange[0]].toFixed(1)} - {BAND_NUMERIC[lastWriting.practiceBandRange[1]].toFixed(1)}
              </div>
              <p className="mt-1 text-tiny text-ink-subtle">From your last submission</p>
              <BandSparkline bands={writingBands} />
            </>
          ) : (
            <p className="mt-2 text-small text-ink-muted">No writing submissions yet.</p>
          )}
        </div>
        <div className="card p-5">
          <p className="label">Speaking readiness</p>
          {lastSpeaking ? (
            <>
              <div className="mt-1 text-subtitle font-semibold">
                Band {BAND_NUMERIC[lastSpeaking.practiceBandRange[0]].toFixed(1)} - {BAND_NUMERIC[lastSpeaking.practiceBandRange[1]].toFixed(1)}
              </div>
              <p className="mt-1 text-tiny text-ink-subtle">From your last submission</p>
              <BandSparkline bands={speakingBands} />
            </>
          ) : (
            <p className="mt-2 text-small text-ink-muted">No speaking submissions yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-subtitle font-semibold">Last 14 days</h2>
        <div className="mt-3 card overflow-x-auto">
          <table className="w-full text-small">
            <thead className="text-tiny uppercase tracking-wider text-ink-subtle">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Minutes</th>
                <th className="px-4 py-3 text-right">Full</th>
                <th className="px-4 py-3 text-right">Partial</th>
                <th className="px-4 py-3 text-right">Done</th>
                <th className="px-4 py-3 text-right">Skipped</th>
                <th className="px-4 py-3 text-left">Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.slice(-14).reverse().map((s) => (
                <tr key={s.date}>
                  <td className="px-4 py-3">{s.date}</td>
                  <td className="px-4 py-3 text-right">{s.minutesStudied ?? s.totalMinutes}</td>
                  <td className="px-4 py-3 text-right">{s.missionsFullyCompleted ?? s.missionsCompleted}</td>
                  <td className="px-4 py-3 text-right">{s.missionsPartiallyCompleted ?? 0}</td>
                  <td className="px-4 py-3 text-right">{s.tasksCompleted ?? 0}</td>
                  <td className="px-4 py-3 text-right">{s.tasksSkipped ?? 0}</td>
                  <td className="px-4 py-3 text-ink-muted">{s.skillsCovered.join(" / ")}</td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                    Complete a daily mission to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <div className="mt-1 text-subtitle font-semibold">{value}</div>
      {sub && <p className="mt-1 text-tiny text-ink-subtle">{sub}</p>}
    </div>
  );
}

function BandSparkline({ bands }: { bands: Array<[import("@/lib/types").BandDifficulty, import("@/lib/types").BandDifficulty]> }) {
  const points = useMemo(() => {
    if (bands.length === 0) return null;
    const ys = bands.map(([lo, hi]) => (BAND_NUMERIC[lo] + BAND_NUMERIC[hi]) / 2);
    const min = 5;
    const max = 9;
    const w = 240;
    const h = 60;
    const stepX = w / Math.max(1, ys.length - 1);
    return ys.map((y, i) => {
      const ny = h - ((y - min) / (max - min)) * h;
      return { x: i * stepX, y: ny, value: y };
    });
  }, [bands]);
  if (!points || points.length === 0) return null;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 240 60" className="mt-3 h-12 w-full">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" className="fill-accent" />
      ))}
    </svg>
  );
}
