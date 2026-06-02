// ============================================================================
// FEEDBACK MOCK - pure functions, no Node dependencies.
// Used only when NEXT_PUBLIC_DEMO_MODE=true.
// ============================================================================

import type { WritingFeedback, SpeakingFeedback, MistakeCode } from "./types";

export type WritingMockInput = {
  taskType: string;
  prompt: string;
  text: string;
  wordCount: number;
};

export type SpeakingMockInput = {
  part: 1 | 2 | 3;
  prompt: string;
  transcript: string;
  transcriptConfidence: "high" | "medium" | "low";
  answerSeconds: number;
};

const DEMO_TRANSCRIPT =
  "I think technology is very important for education. Many students use laptop and phone every day, and they can learn from online. For example, in my country, students now use video and apps to study English. It is more flexible. But also, some students can not focus if they use screen too much, so teachers are still important.";

export function mockTranscribe(): { transcript: string; confidence: "high" | "medium" | "low" } {
  return { transcript: DEMO_TRANSCRIPT, confidence: "medium" };
}

export function mockWritingFeedback(input: WritingMockInput): WritingFeedback {
  const wc = input.wordCount;
  const codes: MistakeCode[] = [];
  if (wc < (input.taskType === "task1" ? 150 : 250)) codes.push("W10");
  if (/\b(is|are|was|were)\s+(very|many|much|good|bad|important)\b/i.test(input.text)) codes.push("W7");
  if (/\b(it|this|that|these|those)\s+(is|are)\s+(very|so|really)\b/i.test(input.text)) codes.push("W6");
  if (input.text.split(".").some((s) => s.split(" ").length > 30)) codes.push("W8");
  if (codes.length === 0) codes.push("W1");

  const firstSentence = input.text.split(/[.!?]/)[0]?.trim() || "The topic is important.";
  return {
    practiceBandRange: ["band6_0", "band6_5"],
    criteria: {
      taskResponse: { score: 6, comment: "You addressed the topic, but the position could be sharper. State a clear thesis in the first sentence." },
      coherenceCohesion: { score: 6, comment: "Your structure is visible, but linking is sometimes mechanical. Vary your connectors." },
      lexicalResource: { score: 6, comment: "Vocabulary is mostly accurate but includes some generic words. Aim for more precise academic terms." },
      grammaticalRange: { score: 6, comment: "You use a mix of structures, but articles and word order need attention in a few places." },
    },
    topFixes: [
      "Make the thesis more specific in the first sentence.",
      "Replace generic words (good, bad, important) with more precise academic vocabulary.",
      "Vary sentence length - long sentences should be split when they carry too many ideas.",
    ],
    beforeAfter: [
      {
        before: firstSentence,
        after: firstSentence.replace(/^(It is|This is|There is|Today)/, "Although this view is common,") + " the position is more nuanced than the surface suggests.",
        why: "A direct thesis gives the reader a clear position and a reason to keep reading.",
      },
    ],
    savedMistakes: codes.slice(0, 3).map((c) => ({
      code: c,
      excerpt: firstSentence,
      note: MISTAKE_NOTE[c],
    })),
    nextDrill: {
      type: "writing_micro_thesis",
      prompt: "Rewrite this thesis to be clearer and more specific.\n\nOriginal: 'Modern life has changed because of new technology.'",
    },
  };
}

export function mockSpeakingFeedback(input: SpeakingMockInput): SpeakingFeedback {
  const transcript = input.transcript;
  const wordCount = transcript.trim().split(/\s+/).length;
  const codes: MistakeCode[] = [];
  if (input.answerSeconds < 30 && input.part !== 1) codes.push("S1");
  if (/\b(um|uh|er|like|you know)\b/gi.test(transcript)) codes.push("S2");
  if (/\b(very|really|important|big|nice|good)\b/gi.test(transcript)) codes.push("S6");
  if (wordCount < 30) codes.push("S1");
  if (codes.length === 0) codes.push("S4");

  return {
    practiceBandRange: ["band6_0", "band6_5"],
    fluencyCoherence: {
      score: 6,
      comment: "You covered the question, but pacing was uneven. Try pausing at the end of each idea to give yourself time to think.",
    },
    lexicalResource: {
      score: 6,
      comment: "Vocabulary is mostly accurate. Use one or two topic-specific words per answer to lift the range.",
    },
    grammaticalRange: {
      score: 6,
      comment: "Mostly accurate, but tense and article errors are visible. Practise short present-perfect answers for Part 1.",
    },
    pronunciationEstimate: {
      score: 6,
      comment: "AI estimate, not examiner-grade. Word endings and stress patterns were clear in most places.",
    },
    topHabits: [
      "Reduce filler words (um, uh, like) by replacing them with a 1-second pause.",
      "Add one topic-specific word per answer to lift lexical range.",
    ],
    betterPhrases: [
      { original: "technology is very important", better: "technology plays a central role in modern education" },
      { original: "many students use laptop and phone", better: "many students rely on laptops and phones for their studies" },
    ],
    savedMistakes: codes.slice(0, 3).map((c) => ({
      code: c,
      excerpt: transcript.split(/[.!?]/)[0] ?? "Your answer",
      note: MISTAKE_NOTE[c],
    })),
    nextPrompt: {
      type: input.part === 1 ? "speaking_part2_cue_card" : "speaking_part1_short",
      prompt: input.part === 1
        ? "Describe a place in your city that you would recommend to visitors."
        : "What do you like most about your job or studies?",
    },
    transcriptConfidence: input.transcriptConfidence,
    transcriptEditable: true,
  };
}

const MISTAKE_NOTE: Record<MistakeCode, string> = {
  L1: "Spelling was close but not exact.",
  L2: "Number or date did not transfer correctly.",
  L3: "Lost place in the audio at a key moment.",
  L4: "Fell for a distractor mentioned but later corrected.",
  L5: "Did not recognise a paraphrased answer.",
  L6: "Missed a plural, article, or word boundary.",
  R1: "Marked True/False when the answer was Not Given (or vice versa).",
  R2: "Matched surface keywords without checking meaning.",
  R3: "Did not recognise a paraphrased answer.",
  R4: "Heading did not summarise the paragraph.",
  R5: "Could not point to the line in the passage.",
  R6: "Time pressure on this question.",
  W1: "Thesis was too broad or not clearly stated.",
  W2: "Topic sentence did not preview the paragraph.",
  W3: "Claim without an example or evidence.",
  W4: "Overview did not summarise the main features.",
  W5: "Cohesion was mechanical in places.",
  W6: "Vocabulary was generic in places.",
  W7: "Grammar accuracy slipped in this sentence.",
  W8: "Sentence was too long to follow easily.",
  W9: "Register was slightly off (too informal or too formal).",
  W10: "Task not fully answered or word count short.",
  S1: "Answer was too short for the question.",
  S2: "Filler words or hesitation appeared.",
  S3: "Same word used several times.",
  S4: "Example was generic or missing.",
  S5: "Grammar accuracy slipped.",
  S6: "Vocabulary was basic where precision would help.",
  S7: "Pronunciation clarity may have been an issue (AI estimate).",
  S8: "Answer drifted off-topic or lacked structure.",
};
