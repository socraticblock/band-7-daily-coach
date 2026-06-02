"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  useProfile,
  useMistakes,
  useMissions,
  useStats,
  useUserContentState,
  bumpStreak,
  markContentAttempted,
  markContentShown,
  markContentSkipped,
  markContentStarted,
} from "@/lib/app-state";
import { loadAllContent, getContentById } from "@/lib/content-loader";
import { generateDailyMission, checkOverrun, checkSkip } from "@/lib/mission-engine";
import type { DailyMission, MissionTask, Skill } from "@/lib/types";

export default function DailyPage() {
  const [profile, setProfile] = useProfile();
  const [mistakes, setMistakes] = useMistakes();
  const [missions, setMissions] = useMissions();
  const [stats, setStats] = useStats();
  const [userContentState, setUserContentState] = useUserContentState();
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [overrunNote, setOverrunNote] = useState<string | null>(null);
  const [skipNote, setSkipNote] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!profile.onboarded) return;
    const existing = missions.find((m) => m.date === today);
    if (existing) {
      setMission(existing);
      return;
    }
    const result = generateDailyMission({
      profile,
      content: loadAllContent(),
      userState: userContentState,
      dueCards: mistakes,
      now: new Date(),
    });
    setMission(result.mission);
    setMissions((current) => [...current.filter((m) => m.date !== today), result.mission]);
    setUserContentState((current) =>
      markContentShown(
        current,
        result.mission.tasks.filter((t) => t.skill !== "review").map((t) => t.sourceContentId),
      ),
    );
  }, [profile, mistakes, missions, today, userContentState, setMissions, setUserContentState]);

  const startTask = (task: MissionTask) => {
    if (!mission) return;
    const updated: DailyMission = {
      ...mission,
      status: "in_progress",
      tasks: mission.tasks.map((t) =>
        t.id === task.id ? { ...t, status: "started", startedAt: new Date().toISOString() } : t,
      ),
    };
    setMission(updated);
    setMissions((current) => [...current.filter((m) => m.date !== today), updated]);
    if (task.skill !== "review") {
      setUserContentState((current) => markContentStarted(current, task.sourceContentId));
    }
  };

  const completeTask = (task: MissionTask) => {
    if (!mission) return;
    const now = new Date();
    const elapsed = task.startedAt
      ? (now.getTime() - new Date(task.startedAt).getTime()) / 1000
      : task.estimatedMinutes * 60;
    const overrun = checkOverrun(task, elapsed);
    if (overrun.action === "graceful_end") {
      setOverrunNote(overrun.reason);
    }
    const updated: DailyMission = {
      ...mission,
      tasks: mission.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: "completed", completedAt: now.toISOString(), elapsedSeconds: elapsed }
          : t,
      ),
    };
    updated.status = evaluateMissionStatus(updated.tasks);
    setMission(updated);
    if (task.skill !== "review") {
      setUserContentState((current) =>
        markContentAttempted(current, task.sourceContentId, { attemptedAt: now.toISOString() }),
      );
    }

    // Persist
    const next = missions.filter((m) => m.date !== today);
    setMissions([...next, updated]);
    const todayKey = today;
    const nextStats = stats.filter((s) => s.date !== todayKey);
    setStats([...nextStats, buildDailyStats(todayKey, updated, mistakes)]);
    if (updated.status === "completed") {
      setProfile(bumpStreak(profile, todayKey));
    }
  };

  const skipTask = (task: MissionTask) => {
    if (!mission) return;
    const skippedThisMission = mission.tasks.filter((t) => t.status === "skipped").length;
    const decision = checkSkip(task.skill, skippedThisMission, skippedThisWeek(missions, today));
    if (decision.action === "deny") {
      setSkipNote("You can skip one task in a mission. Complete or reschedule some real practice before skipping more.");
      return;
    }
    setSkipNote(decision.action === "allow_with_warning" ? decision.message : null);
    const updated: DailyMission = {
      ...mission,
      tasks: mission.tasks.map((t) =>
        t.id === task.id ? { ...t, status: "skipped" } : t,
      ),
    };
    updated.status = evaluateMissionStatus(updated.tasks);
    setMission(updated);
    if (task.skill !== "review") {
      setUserContentState((current) => markContentSkipped(current, task.sourceContentId));
    }
    const next = missions.filter((m) => m.date !== today);
    setMissions([...next, updated]);
    const nextStats = stats.filter((s) => s.date !== today);
    setStats([...nextStats, buildDailyStats(today, updated, mistakes)]);
  };

  if (!profile.onboarded) {
    return (
      <AppShell>
        <div className="card p-6 text-small text-ink-muted">
          Please complete <Link href="/onboarding" className="text-accent hover:underline">onboarding</Link> first.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Daily mission</p>
        <h1 className="mt-1 font-serif text-title">{today}</h1>
        {mission && (
          <p className="mt-1 text-small text-ink-muted">
            {mission.tasks.filter((t) => t.status !== "completed" && t.status !== "skipped").length} of {mission.tasks.length} steps remaining · {mission.targetMinutes} min target
          </p>
        )}
      </div>

      {overrunNote && (
        <div className="mb-4 card border-warn/40 bg-warn/5 p-4 text-small text-warn">
          {overrunNote}
        </div>
      )}

      {skipNote && (
        <div className="mb-4 card border-warn/40 bg-warn/5 p-4 text-small text-warn">
          {skipNote}
        </div>
      )}

      {!mission && <p className="text-small text-ink-muted">Generating your mission…</p>}

      {mission && (
        <ol className="space-y-3">
          {mission.tasks.map((t, i) => {
            const content = getContentById(t.sourceContentId);
            const taskHref = routeForTask(t);
            return (
              <li key={t.id} className="card p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-tiny text-ink-subtle">0{i + 1}</span>
                  <span className="pill">{t.skill}</span>
                  <span className="text-tiny text-ink-muted">{t.estimatedMinutes} min</span>
                  <span className="text-tiny text-ink-subtle">band {t.difficulty.replace("band", "")}</span>
                  <span className="ml-auto text-tiny text-ink-subtle">{t.status}</span>
                </div>
                <h2 className="mt-2 text-subtitle font-semibold">{content?.title || taskTitle(t)}</h2>
                {content?.payload && "prompt" in content.payload && typeof content.payload.prompt === "string" && (
                  <p className="mt-2 text-small text-ink-muted line-clamp-3">{content.payload.prompt}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.status === "ready" && (
                    <button onClick={() => startTask(t)} className="btn-accent btn-sm">
                      Start
                    </button>
                  )}
                  {(t.status === "ready" || t.status === "started") && (
                    <>
                      {taskHref && (
                        <Link
                          href={taskHref}
                          onClick={() => {
                            if (t.status === "ready") startTask(t);
                          }}
                          className="btn-ghost btn-sm"
                        >
                          Open
                        </Link>
                      )}
                      <button onClick={() => completeTask(t)} className="btn-ghost btn-sm">
                        Mark complete
                      </button>
                      <button onClick={() => skipTask(t)} className="btn-ghost btn-sm text-warn">
                        Skip
                      </button>
                    </>
                  )}
                  {t.status === "completed" && (
                    <span className="text-tiny text-success">Completed</span>
                  )}
                  {t.status === "skipped" && (
                    <span className="text-tiny text-ink-subtle">Skipped</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {mission?.status === "partially_completed" && (
        <div className="mt-4 card border-warn/40 bg-warn/5 p-4 text-small text-warn">
          Partially completed. Finish at least one real task, keep skips to one or fewer, and complete due review tasks for a full mission streak.
        </div>
      )}
    </AppShell>
  );
}

function evaluateMissionStatus(tasks: MissionTask[]): DailyMission["status"] {
  const anyProgress = tasks.some((t) => t.status === "started" || t.status === "completed" || t.status === "skipped");
  const allResolved = tasks.every((t) => t.status === "completed" || t.status === "skipped");
  const realTaskCompleted = tasks.some((t) => t.skill !== "review" && t.status === "completed");
  const skippedCount = tasks.filter((t) => t.status === "skipped").length;
  const reviewTasksCompleted = tasks
    .filter((t) => t.skill === "review")
    .every((t) => t.status === "completed");

  if (allResolved && realTaskCompleted && skippedCount <= 1 && reviewTasksCompleted) {
    return "completed";
  }
  return anyProgress ? "partially_completed" : "ready";
}

function buildDailyStats(date: string, mission: DailyMission, mistakes: ReturnType<typeof useMistakes>[0]) {
  const completedTasks = mission.tasks.filter((t) => t.status === "completed");
  const skippedTasks = mission.tasks.filter((t) => t.status === "skipped");
  const minutesStudied = completedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const mistakesSaved = mistakes.filter((m) => m.createdAt.slice(0, 10) === date).length;
  const mistakesReviewed = mistakes.filter((m) => m.lastReviewedAt?.slice(0, 10) === date).length;

  return {
    date,
    missionsCompleted: mission.status === "completed" ? 1 : 0,
    totalMinutes: minutesStudied,
    tasksCompleted: completedTasks.length,
    tasksSkipped: skippedTasks.length,
    missionsFullyCompleted: mission.status === "completed" ? 1 : 0,
    missionsPartiallyCompleted: mission.status === "partially_completed" ? 1 : 0,
    minutesStudied,
    mistakesSaved,
    mistakesReviewed,
    skillsCovered: Array.from(new Set(completedTasks.filter((t) => t.skill !== "review").map((t) => t.skill))),
  };
}

function skippedThisWeek(missions: DailyMission[], today: string): Record<Skill, number> {
  const todayTime = new Date(today).getTime();
  const weekStart = todayTime - 6 * 24 * 60 * 60 * 1000;
  const counts: Partial<Record<Skill, number>> = {};
  for (const mission of missions) {
    const missionTime = new Date(mission.date).getTime();
    if (Number.isNaN(missionTime) || missionTime < weekStart || missionTime > todayTime) continue;
    for (const task of mission.tasks) {
      if (task.status !== "skipped") continue;
      counts[task.skill] = (counts[task.skill] ?? 0) + 1;
    }
  }
  return counts as Record<Skill, number>;
}

function routeForTask(t: MissionTask): string | null {
  const contentParam = `?contentId=${encodeURIComponent(t.sourceContentId)}`;
  switch (t.skill) {
    case "writing":
      return `/writing${contentParam}`;
    case "speaking":
      return `/speaking${contentParam}`;
    case "listening":
      return `/listening${contentParam}`;
    case "reading":
      return `/reading${contentParam}`;
    case "review":
      return "/mistakes";
    case "vocabulary":
    case "grammar":
      return null;
    default:
      return "/daily";
  }
}

function taskTitle(t: MissionTask): string {
  if (t.skill === "review") return "Review saved mistakes";
  if (t.skill === "vocabulary") return "Vocabulary drill";
  if (t.skill === "grammar") return "Grammar drill";
  return `${t.skill} practice`;
}
