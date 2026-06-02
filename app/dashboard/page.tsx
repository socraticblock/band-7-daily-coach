"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useProfile, useMistakes, useMissions, useStats, useUserContentState, markContentShown } from "@/lib/app-state";
import { loadAllContent } from "@/lib/content-loader";
import { generateDailyMission } from "@/lib/mission-engine";
import { pickDailyReviewQueue } from "@/lib/spaced-repetition";
import { BAND_NUMERIC } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, , profileHydrated] = useProfile();
  const [mistakes] = useMistakes();
  const [missions, setMissions] = useMissions();
  const [stats] = useStats();
  const [userContentState, setUserContentState] = useUserContentState();

  // Wait for localStorage hydration before deciding to redirect.
  useEffect(() => {
    if (profileHydrated && !profile.onboarded) {
      router.replace("/onboarding");
    }
  }, [profileHydrated, profile.onboarded, router]);

  const today = new Date().toISOString().slice(0, 10);
  const todaysMission = missions.find((m) => m.date === today);
  const dueCount = pickDailyReviewQueue(mistakes, 8).length;
  const completedMissions = missions.filter((m) => m.status === "completed" || m.status === "partially_completed").length;

  useEffect(() => {
    if (!profileHydrated || !profile.onboarded || todaysMission) return;
    const result = generateDailyMission({
      profile,
      content: loadAllContent(),
      userState: userContentState,
      dueCards: mistakes,
      now: new Date(),
    });
    setMissions((current) => [...current.filter((m) => m.date !== today), result.mission]);
    setUserContentState((current) =>
      markContentShown(
        current,
        result.mission.tasks.filter((t) => t.skill !== "review").map((t) => t.sourceContentId),
      ),
    );
  }, [profileHydrated, profile, todaysMission, userContentState, mistakes, today, setMissions, setUserContentState]);

  const preview = useMemo(() => {
    if (!profile.onboarded) return null;
    if (todaysMission) return todaysMission;
    const result = generateDailyMission({
      profile,
      content: loadAllContent(),
      userState: userContentState,
      dueCards: mistakes,
      now: new Date(),
    });
    return result.mission;
  }, [profile, todaysMission, mistakes, userContentState]);

  // If not onboarded (and we've hydrated), show a loading state until the redirect happens.
  if (profileHydrated && !profile.onboarded) {
    return (
      <AppShell>
        <div className="card p-6 text-small text-ink-muted">Loading…</div>
      </AppShell>
    );
  }

  const bandNum = BAND_NUMERIC[profile.targetBand];

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <p className="label">Today</p>
            <h1 className="mt-1 font-serif text-title">Your daily mission is ready.</h1>
            <p className="mt-2 text-small text-ink-muted">
              {preview ? `${preview.targetMinutes} min · ${preview.tasks.length} focused steps` : "Onboarding needed."}
            </p>
            {preview && preview.tasks.length > 0 ? (
              <ul className="mt-5 space-y-2.5">
                {preview.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 text-small">
                    <span className="pill shrink-0">{t.skill}</span>
                    <span className="text-ink-muted">{t.estimatedMinutes} min</span>
                    <span className="truncate">{labelForType(t.skill, t.type)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-small text-ink-muted">No preview available yet.</p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/daily" className="btn-accent">Start today&apos;s mission</Link>
              <Link href="/mistakes" className="btn-ghost">Review {dueCount} due mistakes</Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Target</p>
            <div className="mt-1 text-subtitle font-semibold">Band {bandNum.toFixed(1)}</div>
            <p className="mt-1 text-tiny text-ink-subtle">Practice readiness is an estimate, not an official score.</p>
          </div>
          <div className="card p-5">
            <p className="label">Streak</p>
            <div className="mt-1 text-subtitle font-semibold">{profile.streakDays} day{profile.streakDays === 1 ? "" : "s"}</div>
            <p className="mt-1 text-tiny text-ink-subtle">Longest: {profile.longestStreak}</p>
          </div>
          <div className="card p-5">
            <p className="label">Missions completed</p>
            <div className="mt-1 text-subtitle font-semibold">{completedMissions}</div>
          </div>
          <div className="card p-5">
            <p className="label">Mistakes mastered</p>
            <div className="mt-1 text-subtitle font-semibold">{mistakes.filter((m) => m.mastered).length}</div>
            <p className="mt-1 text-tiny text-ink-subtle">{dueCount} due today</p>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="mt-8">
          <h2 className="text-subtitle font-semibold">Recent activity</h2>
          <div className="mt-3 card divide-y divide-line">
            {stats.slice(-5).reverse().map((s) => (
              <div key={s.date} className="flex items-center justify-between p-4 text-small">
                <span className="text-ink-muted">{s.date}</span>
                <span>{s.missionsCompleted} mission{s.missionsCompleted === 1 ? "" : "s"}</span>
                <span>{s.totalMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function labelForType(skill: string, type: string): string {
  if (skill === "review") return "Review a saved mistake";
  if (type.startsWith("writing_task1")) return "Writing Task 1 — report";
  if (type.startsWith("writing_task2")) return "Writing Task 2 — essay";
  if (type.startsWith("writing_micro")) return "Writing micro-drill";
  if (type.startsWith("writing_paragraph")) return "Writing paragraph drill";
  if (type.startsWith("reading_")) return "Reading practice";
  if (type.startsWith("listening_")) return "Listening practice";
  if (type.startsWith("speaking_part1")) return "Speaking Part 1";
  if (type.startsWith("speaking_part2")) return "Speaking Part 2 — cue card";
  if (type.startsWith("speaking_part3")) return "Speaking Part 3";
  if (type === "vocabulary_drill") return "Vocabulary drill";
  if (type === "grammar_drill") return "Grammar drill";
  return "Practice";
}
