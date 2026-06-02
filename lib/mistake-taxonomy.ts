// ============================================================================
// CLOSED 30-CODE MISTAKE TAXONOMY
// The AI classifier must map any detected mistake into exactly one of these.
// New codes require a spec change — do not invent labels at runtime.
// ============================================================================

import type { MistakeCode, Skill } from "./types";

export type MistakeMeta = {
  code: MistakeCode;
  skill: Skill;
  label: string;
  description: string;
  reviewTemplate: string;
};

export const MISTAKE_TAXONOMY: Record<MistakeCode, MistakeMeta> = {
  // Listening
  L1: {
    code: "L1",
    skill: "listening",
    label: "Spelling error",
    description: "Answer was correct in sound but wrong in spelling.",
    reviewTemplate: "Listen again and type the answer exactly as spelled in the audio.",
  },
  L2: {
    code: "L2",
    skill: "listening",
    label: "Number / date error",
    description: "Confused a number, date, time, or price during transfer.",
    reviewTemplate: "Practice writing numbers, dates, and prices while listening.",
  },
  L3: {
    code: "L3",
    skill: "listening",
    label: "Lost place in audio",
    description: "Stopped following the recording at a key point.",
    reviewTemplate: "Try the same exercise in practice mode with replay.",
  },
  L4: {
    code: "L4",
    skill: "listening",
    label: "Distractor trap",
    description: "Picked an answer that was mentioned but later corrected in the audio.",
    reviewTemplate: "Always wait for the speaker to finish before answering.",
  },
  L5: {
    code: "L5",
    skill: "listening",
    label: "Paraphrase missed",
    description: "Did not recognise a paraphrased answer.",
    reviewTemplate: "Listen for meaning, not exact words from the question.",
  },
  L6: {
    code: "L6",
    skill: "listening",
    label: "Word boundary / plural",
    description: "Missed a plural, article, or word boundary.",
    reviewTemplate: "Underline the article, plural marker, or word boundary in the transcript.",
  },

  // Reading
  R1: {
    code: "R1",
    skill: "reading",
    label: "Not Given confusion",
    description: "Marked True/False when the answer was Not Given (or vice versa).",
    reviewTemplate: "If the passage does not mention the statement, the answer is Not Given.",
  },
  R2: {
    code: "R2",
    skill: "reading",
    label: "Keyword trap",
    description: "Matched surface keywords without checking meaning.",
    reviewTemplate: "Re-read the sentence that contains the keywords and check the meaning.",
  },
  R3: {
    code: "R3",
    skill: "reading",
    label: "Paraphrase missed",
    description: "Did not recognise a paraphrased answer.",
    reviewTemplate: "Look for synonyms and rephrasings, not the same words.",
  },
  R4: {
    code: "R4",
    skill: "reading",
    label: "Heading mismatch",
    description: "Chose a heading that did not summarise the paragraph.",
    reviewTemplate: "Read the first and last sentence of the paragraph before choosing.",
  },
  R5: {
    code: "R5",
    skill: "reading",
    label: "Evidence not found",
    description: "Chose an answer without being able to point to the line in the passage.",
    reviewTemplate: "If you cannot quote the evidence, the answer is probably wrong.",
  },
  R6: {
    code: "R6",
    skill: "reading",
    label: "Time-management issue",
    description: "Ran out of time, or spent too long on one question.",
    reviewTemplate: "Allocate 20 minutes per passage. If stuck, guess and move on.",
  },

  // Writing
  W1: {
    code: "W1",
    skill: "writing",
    label: "Unclear thesis",
    description: "Position is too broad or not clearly stated.",
    reviewTemplate: "Rewrite the thesis in one sentence with a definite position.",
  },
  W2: {
    code: "W2",
    skill: "writing",
    label: "Weak topic sentence",
    description: "Topic sentence does not preview the paragraph content.",
    reviewTemplate: "Make the topic sentence clearly announce one main idea.",
  },
  W3: {
    code: "W3",
    skill: "writing",
    label: "Unsupported idea",
    description: "Claim made without example or evidence.",
    reviewTemplate: "Add at least one concrete example, study, or specific situation.",
  },
  W4: {
    code: "W4",
    skill: "writing",
    label: "Weak overview",
    description: "Task 1 overview does not summarise the main features.",
    reviewTemplate: "Write 1–2 sentences that state the most important trends or comparisons.",
  },
  W5: {
    code: "W5",
    skill: "writing",
    label: "Poor cohesion",
    description: "Linking is mechanical or missing between ideas.",
    reviewTemplate: "Use a small range of linking devices naturally, not as filler.",
  },
  W6: {
    code: "W6",
    skill: "writing",
    label: "Vague vocabulary",
    description: "Generic words used instead of precise academic vocabulary.",
    reviewTemplate: "Replace 'big' / 'important' / 'things' with more precise terms.",
  },
  W7: {
    code: "W7",
    skill: "writing",
    label: "Grammar accuracy",
    description: "Article, tense, agreement, or preposition error.",
    reviewTemplate: "Re-read the sentence and check articles, verb forms, and word order.",
  },
  W8: {
    code: "W8",
    skill: "writing",
    label: "Sentence too long",
    description: "Sentence is hard to follow because it has too many clauses.",
    reviewTemplate: "Split the sentence into two. Aim for one idea per sentence.",
  },
  W9: {
    code: "W9",
    skill: "writing",
    label: "Wrong register",
    description: "Tone is too informal, too legalistic, or too academic.",
    reviewTemplate: "Aim for clear academic English. Avoid legalese and slang.",
  },
  W10: {
    code: "W10",
    skill: "writing",
    label: "Task not fully answered",
    description: "Word count short, or part of the question not addressed.",
    reviewTemplate: "Re-read the prompt. Make sure every part is answered and the minimum word count is met.",
  },

  // Speaking
  S1: {
    code: "S1",
    skill: "speaking",
    label: "Answer too short",
    description: "Answer was under 2 sentences or under the time target.",
    reviewTemplate: "Extend with a reason, example, or consequence.",
  },
  S2: {
    code: "S2",
    skill: "speaking",
    label: "Hesitation",
    description: "Frequent pauses or filler words before content words.",
    reviewTemplate: "Practice the cue card twice with the timer.",
  },
  S3: {
    code: "S3",
    skill: "speaking",
    label: "Repetition",
    description: "Same word or phrase used many times in the answer.",
    reviewTemplate: "Prepare 2–3 synonyms for the key concept before recording.",
  },
  S4: {
    code: "S4",
    skill: "speaking",
    label: "Weak example",
    description: "Example is generic or missing.",
    reviewTemplate: "Add one specific personal or observed example.",
  },
  S5: {
    code: "S5",
    skill: "speaking",
    label: "Grammar accuracy",
    description: "Tense, article, or agreement error during speech.",
    reviewTemplate: "Re-record the answer focusing only on grammar accuracy.",
  },
  S6: {
    code: "S6",
    skill: "speaking",
    label: "Limited vocabulary",
    description: "Repeated basic vocabulary where more precise words would help.",
    reviewTemplate: "Use 1–2 more precise or topic-specific words in the next take.",
  },
  S7: {
    code: "S7",
    skill: "speaking",
    label: "Pronunciation clarity estimate",
    description: "Word endings or stress may have been unclear. AI estimate only.",
    reviewTemplate: "Listen to the recording and underline words that are unclear.",
  },
  S8: {
    code: "S8",
    skill: "speaking",
    label: "Coherence issue",
    description: "Answer drifted off-topic or lacked a clear structure.",
    reviewTemplate: "Start with a direct answer, then add one reason and one example.",
  },
};

export const MISTAKE_CODES = Object.keys(MISTAKE_TAXONOMY) as MistakeCode[];

export function isValidMistakeCode(value: string): value is MistakeCode {
  return MISTAKE_CODES.includes(value as MistakeCode);
}

export function getMistakeMeta(code: MistakeCode): MistakeMeta {
  return MISTAKE_TAXONOMY[code];
}
