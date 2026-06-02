// ============================================================================
// DAILY MISSION ENGINE
// - Uses the locked types
// - Honors the fallback chain when content is exhausted
// - Enforces skip limits and overrun rules
// ============================================================================

import type {
  BandDifficulty,
  ContentItem,
  DailyMission,
  FocusSkill,
  MissionTask,
  MissionTaskType,
  Skill,
  TopicProfile,
  UserContentState,
  UserProfile,
} from "./types";
import { BAND_ORDER, BAND_NUMERIC } from "./types";
import { pickDailyReviewQueue } from "./spaced-repetition";
import type { MistakeCard } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type MissionGenerationInput = {
  profile: UserProfile;
  content: ContentItem[];
  userState: UserContentState[];
  dueCards: MistakeCard[];
  isFirstSession?: boolean;
  now?: Date;
};

export type MissionGenerationResult = {
  mission: DailyMission;
  fallbackUsed: boolean;
  fallbackNotes: string[];
  contentExhausted: Record<Skill, boolean>;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function todayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bandOffset(b: BandDifficulty, delta: number): BandDifficulty {
  const idx = BAND_ORDER.indexOf(b);
  const next = Math.max(0, Math.min(BAND_ORDER.length - 1, idx + delta));
  return BAND_ORDER[next] as BandDifficulty;
}

function isShownWithin(state: UserContentState | undefined, days: number, now: Date): boolean {
  if (!state?.lastShownAt) return false;
  const last = new Date(state.lastShownAt);
  return now.getTime() - last.getTime() < days * DAY_MS;
}

function isOnCooldown(state: UserContentState | undefined, cooldownDays: number, now: Date): boolean {
  if (!state?.lastAttemptedAt) return false;
  if (!state.masteryStatus || state.masteryStatus !== "mastered") return false;
  const last = new Date(state.lastAttemptedAt);
  return now.getTime() - last.getTime() < cooldownDays * DAY_MS;
}

function buildTaskFromContent(c: ContentItem): MissionTask {
  return {
    id: `task-${c.id}-${Date.now()}`,
    skill: c.skill,
    type: c.type,
    estimatedMinutes: c.estimatedMinutes,
    difficulty: c.difficulty,
    status: "ready",
    sourceContentId: c.id,
  };
}

function reviewTaskFromCard(card: MistakeCard): MissionTask {
  return {
    id: `task-review-${card.id}`,
    skill: "review",
    type: "review_card",
    estimatedMinutes: 1.5,
    difficulty: "band6_5",
    status: "ready",
    sourceContentId: card.id,
  };
}

function profileMatchScore(c: ContentItem, profile: TopicProfile): number {
  if (c.profileTags.includes(profile)) return 3;
  if (c.profileTags.includes("general_academic")) return 1;
  return 0;
}

// ----------------------------------------------------------------------------
// Selector — implements the locked fallback chain
// ----------------------------------------------------------------------------

export function selectContentForSlot(
  slot: { skill: Skill; type?: MissionTaskType; preferProfile?: TopicProfile; difficulty?: BandDifficulty },
  pool: ContentItem[],
  userState: UserContentState[],
  now: Date,
): { content: ContentItem | null; fallbackUsed: boolean; fallbackNote: string } {
  const stateMap = new Map(userState.map((s) => [s.contentId, s]));

  // Filter by slot
  let candidates = pool.filter((c) => {
    if (c.reviewStatus !== "approved") return false;
    if (c.skill !== slot.skill) return false;
    if (slot.type && c.type !== slot.type) return false;
    return true;
  });

  if (slot.preferProfile) {
    candidates = [...candidates].sort(
      (a, b) => profileMatchScore(b, slot.preferProfile!) - profileMatchScore(a, slot.preferProfile!),
    );
  }

  // Step 1: approved, not shown in 7 days
  const fresh = candidates.filter((c) => !isShownWithin(stateMap.get(c.id), 7, now));
  if (fresh.length > 0) {
    return { content: fresh[0] as ContentItem, fallbackUsed: false, fallbackNote: "" };
  }

  // Step 2: any unseen approved
  const unseen = candidates.filter((c) => {
    const s = stateMap.get(c.id);
    return !s || s.masteryStatus === "unseen";
  });
  if (unseen.length > 0) {
    return { content: unseen[0] as ContentItem, fallbackUsed: true, fallbackNote: "reused-unseen" };
  }

  // Step 3: previously attempted with mistakes
  const retried = candidates.filter((c) => {
    const s = stateMap.get(c.id);
    return s && s.attempts > 0 && s.masteryStatus !== "mastered";
  });
  if (retried.length > 0) {
    return { content: retried[0] as ContentItem, fallbackUsed: true, fallbackNote: "retry-with-mistakes" };
  }

  // Step 4: same skill, one band higher or lower
  if (slot.difficulty) {
    const adj = candidates.filter((c) =>
      c.difficulty === bandOffset(slot.difficulty!, -1) ||
      c.difficulty === bandOffset(slot.difficulty!, 1),
    );
    if (adj.length > 0) {
      return { content: adj[0] as ContentItem, fallbackUsed: true, fallbackNote: "shifted-band" };
    }
  }

  // Step 5: no content — caller must replace
  return { content: null, fallbackUsed: true, fallbackNote: "exhausted" };
}

// ----------------------------------------------------------------------------
// Mission generator
// ----------------------------------------------------------------------------

export function generateDailyMission(input: MissionGenerationInput): MissionGenerationResult {
  const { profile, content, userState, dueCards, isFirstSession, now = new Date() } = input;
  const fallbackNotes: string[] = [];
  const contentExhausted: Record<Skill, boolean> = {
    listening: false,
    reading: false,
    writing: false,
    speaking: false,
    review: false,
    vocabulary: false,
    grammar: false,
  };

  // First-session mission is hand-tuned and short
  if (isFirstSession) {
    const readingPick = selectContentForSlot(
      { skill: "reading", type: "reading_true_false_not_given" },
      content,
      userState,
      now,
    );
    const writingPick = selectContentForSlot(
      { skill: "writing", type: "writing_micro_thesis" },
      content,
      userState,
      now,
    );

    const tasks: MissionTask[] = [];
    if (readingPick.content) {
      tasks.push(buildTaskFromContent(readingPick.content));
    } else {
      contentExhausted.reading = true;
    }
    if (writingPick.content) {
      tasks.push(buildTaskFromContent(writingPick.content));
    } else {
      contentExhausted.writing = true;
    }
    // One review-style card placeholder (no real mistake yet, uses a vocab drill as warm-up)
    const vocabPick = selectContentForSlot(
      { skill: "vocabulary", type: "vocabulary_drill" },
      content,
      userState,
      now,
    );
    if (vocabPick.content) {
      tasks.push(buildTaskFromContent(vocabPick.content));
    }

    return {
      mission: {
        id: `mission-${todayKey(now)}-first`,
        date: todayKey(now),
        targetMinutes: 10,
        focusSkill: "mixed",
        tasks,
        status: "ready",
        isFirstSession: true,
      },
      fallbackUsed: false,
      fallbackNotes,
      contentExhausted,
    };
  }

  const tasks: MissionTask[] = [];
  const reviewQueue = pickDailyReviewQueue(dueCards, 8, now);

  // 1. Weak-skill task (if any)
  const weakSkill: Skill = profile.weakestSkill === "unknown" ? "writing" : profile.weakestSkill;
  if (weakSkill === "writing" || weakSkill === "speaking") {
    const pick = selectContentForSlot(
      { skill: weakSkill, preferProfile: profile.topicProfile, difficulty: profile.targetBand },
      content,
      userState,
      now,
    );
    if (pick.content) {
      tasks.push(buildTaskFromContent(pick.content));
      if (pick.fallbackNote) fallbackNotes.push(`weak:${pick.fallbackNote}`);
    } else {
      contentExhausted[weakSkill] = true;
    }
  } else {
    const pick = selectContentForSlot(
      { skill: weakSkill, preferProfile: profile.topicProfile, difficulty: profile.targetBand },
      content,
      userState,
      now,
    );
    if (pick.content) {
      tasks.push(buildTaskFromContent(pick.content));
      if (pick.fallbackNote) fallbackNotes.push(`weak:${pick.fallbackNote}`);
    } else {
      contentExhausted[weakSkill] = true;
    }
  }

  // 2. Receptive task (Listening or Reading) — alternate per day
  const receptive: Skill = (new Date(now).getDate() % 2 === 0) ? "listening" : "reading";
  const receptivePick = selectContentForSlot(
    { skill: receptive, preferProfile: profile.topicProfile, difficulty: profile.targetBand },
    content,
    userState,
    now,
  );
  if (receptivePick.content) {
    tasks.push(buildTaskFromContent(receptivePick.content));
    if (receptivePick.fallbackNote) fallbackNotes.push(`receptive:${receptivePick.fallbackNote}`);
  } else {
    contentExhausted[receptive] = true;
  }

  // 3. Productive task (Writing or Speaking) — opposite of the previous
  const productive: Skill = (weakSkill === "writing" || weakSkill === "speaking")
    ? (weakSkill === "writing" ? "speaking" : "writing")
    : ((new Date(now).getDate() % 2 === 0) ? "writing" : "speaking");
  const productivePick = selectContentForSlot(
    { skill: productive, preferProfile: profile.topicProfile, difficulty: profile.targetBand },
    content,
    userState,
    now,
  );
  if (productivePick.content) {
    tasks.push(buildTaskFromContent(productivePick.content));
    if (productivePick.fallbackNote) fallbackNotes.push(`productive:${productivePick.fallbackNote}`);
  } else {
    contentExhausted[productive] = true;
  }

  // 4. Review cards (cap 3 to leave room for the rest of the day)
  const reviewToAdd = reviewQueue.slice(0, 3);
  for (const card of reviewToAdd) {
    tasks.push(reviewTaskFromCard(card));
  }

  // 5. Optional vocabulary warm-up if there's still budget
  const currentTotal = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  if (currentTotal < profile.dailyMinutes - 3) {
    const vocabPick = selectContentForSlot(
      { skill: "vocabulary", type: "vocabulary_drill", preferProfile: profile.topicProfile },
      content,
      userState,
      now,
    );
    if (vocabPick.content) {
      tasks.push(buildTaskFromContent(vocabPick.content));
    }
  }

  // Final time check — if we're way over, drop the lowest-priority task
  while (tasks.reduce((s, t) => s + t.estimatedMinutes, 0) > profile.dailyMinutes && tasks.length > 2) {
    tasks.pop();
  }

  const focusSkill: FocusSkill =
    weakSkill === "writing" || weakSkill === "speaking" ? weakSkill : "mixed";

  return {
    mission: {
      id: `mission-${todayKey(now)}`,
      date: todayKey(now),
      targetMinutes: profile.dailyMinutes,
      focusSkill,
      tasks,
      status: "ready",
    },
    fallbackUsed: fallbackNotes.length > 0,
    fallbackNotes,
    contentExhausted,
  };
}

// ----------------------------------------------------------------------------
// Overrun rule
// ----------------------------------------------------------------------------

export type OverrunDecision =
  | { action: "continue" }
  | { action: "graceful_end"; rescheduleTasks: MissionTask[]; reason: string };

export function checkOverrun(
  task: MissionTask,
  elapsedSeconds: number,
): OverrunDecision {
  const limit = task.estimatedMinutes * 2 * 60;
  if (elapsedSeconds <= limit) return { action: "continue" };
  return {
    action: "graceful_end",
    rescheduleTasks: [],
    reason: `This ${task.skill} task took longer than expected. Good work staying with it. We saved your progress. The remaining task will move to tomorrow so today's session does not become too heavy.`,
  };
}

// ----------------------------------------------------------------------------
// Skip rule
// ----------------------------------------------------------------------------

export type SkipDecision =
  | { action: "allow" }
  | { action: "allow_with_warning"; message: string }
  | { action: "deny" };

export function checkSkip(
  skill: Skill,
  skipsThisMission: number,
  skipsThisWeek: Record<Skill, number>,
): SkipDecision {
  if (skipsThisMission >= 1) {
    return {
      action: "deny",
    };
  }
  const weekCount = skipsThisWeek[skill] ?? 0;
  if (weekCount >= 2) {
    // 3rd skip in this skill this week — still allow but tomorrow leads with this skill
    return {
      action: "allow_with_warning",
      message: `You have skipped ${skill} several times this week. That usually means it is the skill causing the most friction. Tomorrow's mission will start with a short ${skill} drill, not a full task.`,
    };
  }
  return { action: "allow" };
}
