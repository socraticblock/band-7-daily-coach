// ============================================================================
// CONTENT LOADER — loads from /content TS/JSON files.
// V1.5: replace with a CMS-backed loader without changing call sites.
// ============================================================================

import type { ContentItem } from "./types";
import { WRITING_PROMPTS } from "@/content/writing-prompts";
import { SPEAKING_PROMPTS } from "@/content/speaking-prompts";
import { VOCABULARY_ITEMS } from "@/content/vocabulary";
import { GRAMMAR_DRILLS } from "@/content/grammar";
import LISTENING_BANK from "@/content/listening/bank.json";
import READING_BANK from "@/content/reading/bank.json";

export function loadAllContent(): ContentItem[] {
  return [
    ...(LISTENING_BANK as ContentItem[]),
    ...(READING_BANK as ContentItem[]),
    ...WRITING_PROMPTS,
    ...SPEAKING_PROMPTS,
    ...VOCABULARY_ITEMS,
    ...GRAMMAR_DRILLS,
  ];
}

export function contentForSkill(skill: ContentItem["skill"]): ContentItem[] {
  return loadAllContent().filter((c) => c.skill === skill && c.reviewStatus === "approved");
}

export function getContentById(id: string): ContentItem | undefined {
  return loadAllContent().find((c) => c.id === id);
}
