// ============================================================================
// APP STATE — single store for the prototype, kept in localStorage.
// Lives in /lib so both pages and components can read/write the same shape.
// V1 swaps to Supabase. Call sites do not change.
// ============================================================================

"use client";

import { useLocalStorage } from "./storage";
import type {
  DailyMission,
  MistakeCard,
  UserProfile,
  UserContentState,
  DailyStats,
  WritingFeedback,
  SpeakingFeedback,
} from "./types";
import { TOPIC_PROFILES, TOPIC_PROFILE_LABEL } from "./types";

const PROFILE_KEY = "b7dc.profile";
const MISSIONS_KEY = "b7dc.missions";
const USER_STATE_KEY = "b7dc.userContentState";
const MISTAKES_KEY = "b7dc.mistakes";
const STATS_KEY = "b7dc.stats";
const WRITING_FEEDBACK_KEY = "b7dc.writingFeedback";
const SPEAKING_FEEDBACK_KEY = "b7dc.speakingFeedback";
const AI_DISCLOSURE_KEY = "b7dc.aiDisclosureAccepted";

const DEFAULT_PROFILE: UserProfile = {
  id: "local-user",
  createdAt: new Date().toISOString(),
  targetBand: "band7_0",
  testDate: "no_date",
  weakestSkill: "unknown",
  topicProfile: "general_academic",
  dailyMinutes: 25,
  onboarded: false,
  streakDays: 0,
  longestStreak: 0,
};

export function useProfile() {
  return useLocalStorage<UserProfile>(PROFILE_KEY, DEFAULT_PROFILE);
}

export function useMissions() {
  return useLocalStorage<DailyMission[]>(MISSIONS_KEY, []);
}

export function useUserContentState() {
  return useLocalStorage<UserContentState[]>(USER_STATE_KEY, []);
}

export function useMistakes() {
  return useLocalStorage<MistakeCard[]>(MISTAKES_KEY, []);
}

export function useStats() {
  return useLocalStorage<DailyStats[]>(STATS_KEY, []);
}

export function useWritingFeedback() {
  return useLocalStorage<WritingFeedback[]>(WRITING_FEEDBACK_KEY, []);
}

export function useSpeakingFeedback() {
  return useLocalStorage<SpeakingFeedback[]>(SPEAKING_FEEDBACK_KEY, []);
}

export function useAiDisclosureAccepted() {
  return useLocalStorage<boolean>(AI_DISCLOSURE_KEY, false);
}

function emptyContentState(contentId: string): UserContentState {
  return {
    contentId,
    attempts: 0,
    completedCount: 0,
    skippedCount: 0,
    masteryStatus: "unseen",
  };
}

function normalizeContentState(state: UserContentState): UserContentState {
  return {
    ...emptyContentState(state.contentId),
    ...state,
    masteryStatus: state.masteryStatus ?? "unseen",
  };
}

function updateContentStates(
  states: UserContentState[],
  contentIds: string[],
  updater: (state: UserContentState) => UserContentState,
): UserContentState[] {
  const ids = Array.from(new Set(contentIds.filter(Boolean)));
  if (ids.length === 0) return states;
  const map = new Map(states.map((s) => [s.contentId, normalizeContentState(s)]));
  for (const contentId of ids) {
    map.set(contentId, updater(map.get(contentId) ?? emptyContentState(contentId)));
  }
  return Array.from(map.values());
}

export function markContentShown(
  states: UserContentState[],
  contentIds: string[],
  shownAt = new Date().toISOString(),
): UserContentState[] {
  return updateContentStates(states, contentIds, (state) => ({
    ...state,
    lastShownAt: shownAt,
    masteryStatus: state.masteryStatus === "unseen" ? "shown" : state.masteryStatus,
  }));
}

export function markContentStarted(
  states: UserContentState[],
  contentId: string,
  startedAt = new Date().toISOString(),
): UserContentState[] {
  return updateContentStates(states, [contentId], (state) => ({
    ...state,
    lastStartedAt: startedAt,
    masteryStatus: state.masteryStatus === "mastered" ? "mastered" : "in_progress",
  }));
}

export function markContentAttempted(
  states: UserContentState[],
  contentId: string,
  options: { attemptedAt?: string; score?: number; mastery?: "attempted" | "mastered"; receptiveMastery?: boolean } = {},
): UserContentState[] {
  const attemptedAt = options.attemptedAt ?? new Date().toISOString();
  return updateContentStates(states, [contentId], (state) => {
    const bestScore = typeof options.score === "number"
      ? Math.max(state.bestScore ?? Number.NEGATIVE_INFINITY, options.score)
      : state.bestScore;
    const reachedSecondPerfect =
      options.receptiveMastery === true &&
      typeof options.score === "number" &&
      options.score >= 1 &&
      (state.bestScore ?? 0) >= 1;
    return {
      ...state,
      attempts: state.attempts + 1,
      completedCount: state.completedCount + 1,
      lastAttemptedAt: attemptedAt,
      bestScore,
      masteryStatus: options.mastery === "mastered" || reachedSecondPerfect
        ? "mastered"
        : "attempted",
    };
  });
}

export function markContentSkipped(
  states: UserContentState[],
  contentId: string,
): UserContentState[] {
  return updateContentStates(states, [contentId], (state) => ({
    ...state,
    skippedCount: state.skippedCount + 1,
    masteryStatus: state.masteryStatus === "mastered" ? "mastered" : state.masteryStatus === "unseen" ? "shown" : state.masteryStatus,
  }));
}

export function setOnboarded(profile: UserProfile): UserProfile {
  return { ...profile, onboarded: true };
}

export function bumpStreak(profile: UserProfile, today: string): UserProfile {
  if (profile.lastActiveDate === today) return profile;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const continued = profile.lastActiveDate === yesterday;
  const streak = continued ? profile.streakDays + 1 : 1;
  return {
    ...profile,
    lastActiveDate: today,
    streakDays: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
  };
}

export { TOPIC_PROFILES, TOPIC_PROFILE_LABEL };
