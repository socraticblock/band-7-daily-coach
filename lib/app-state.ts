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
