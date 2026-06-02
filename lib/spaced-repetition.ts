// ============================================================================
// SPACED REPETITION — simple, predictable, no surprise algorithms.
// Again  -> 1 day
// Almost -> 3 days
// Mastered -> 7 days, then 14 days
// ============================================================================

import type { MistakeCard, ReviewMark } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function nextReviewDate(card: MistakeCard, mark: ReviewMark, now = new Date()): string {
  let days = 0;
  if (mark === "again") {
    days = 1;
  } else if (mark === "almost") {
    days = 3;
  } else {
    // mastered: progressively longer interval once stable
    const reviews = card.reviewCount;
    if (reviews < 2) days = 7;
    else days = 14;
  }
  const d = new Date(now.getTime() + days * DAY_MS);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function applyMark(
  card: MistakeCard,
  mark: ReviewMark,
  now = new Date(),
): MistakeCard {
  const isMastered = mark === "mastered" && card.reviewCount >= 1;
  return {
    ...card,
    lastReviewedAt: now.toISOString(),
    reviewCount: card.reviewCount + 1,
    reviewStage: mark === "again" ? 1 : mark === "almost" ? 2 : 3,
    reviewDueAt: nextReviewDate(card, mark, now),
    mastered: isMastered,
  };
}

export function isDue(card: MistakeCard, today = new Date()): boolean {
  if (card.mastered) return false;
  const due = new Date(card.reviewDueAt + "T00:00:00");
  return due <= today;
}

export function dueCards(cards: MistakeCard[], today = new Date()): MistakeCard[] {
  return cards.filter((c) => isDue(c, today));
}

export function pickDailyReviewQueue(
  all: MistakeCard[],
  max = 8,
  today = new Date(),
): MistakeCard[] {
  const due = dueCards(all, today);
  // Sort: never-reviewed first, then by reviewDueAt ascending
  const sorted = [...due].sort((a, b) => {
    if (a.reviewCount === 0 && b.reviewCount > 0) return -1;
    if (b.reviewCount === 0 && a.reviewCount > 0) return 1;
    return a.reviewDueAt.localeCompare(b.reviewDueAt);
  });
  return sorted.slice(0, max);
}
