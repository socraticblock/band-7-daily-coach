// ============================================================================
// LOCKED TYPE UNIONS — do not weaken with loose strings.
// Every value used at runtime must be one of these closed sets.
// ============================================================================

export type Skill =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "review"
  | "vocabulary"
  | "grammar";

export type FocusSkill =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "mixed";

export type BandDifficulty =
  | "band5_5"
  | "band6_0"
  | "band6_5"
  | "band7_0"
  | "band7_5"
  | "band8_0";

export const BAND_ORDER: BandDifficulty[] = [
  "band5_5",
  "band6_0",
  "band6_5",
  "band7_0",
  "band7_5",
  "band8_0",
];

export const BAND_NUMERIC: Record<BandDifficulty, number> = {
  band5_5: 5.5,
  band6_0: 6.0,
  band6_5: 6.5,
  band7_0: 7.0,
  band7_5: 7.5,
  band8_0: 8.0,
};

export type MissionStatus =
  | "ready"
  | "in_progress"
  | "paused"
  | "completed"
  | "partially_completed";

export type TaskStatus =
  | "locked"
  | "ready"
  | "started"
  | "completed"
  | "skipped"
  | "rescheduled";

export type MissionTaskType =
  | "listening_form_completion"
  | "listening_note_completion"
  | "listening_table_completion"
  | "listening_sentence_completion"
  | "listening_multiple_choice"
  | "listening_matching"
  | "listening_map_labelling"
  | "listening_diagram_labelling"
  | "reading_true_false_not_given"
  | "reading_yes_no_not_given"
  | "reading_matching_headings"
  | "reading_matching_information"
  | "reading_matching_features"
  | "reading_sentence_completion"
  | "reading_summary_completion"
  | "reading_multiple_choice"
  | "reading_short_answer"
  | "writing_task1_report"
  | "writing_task2_essay"
  | "writing_micro_thesis"
  | "writing_paragraph_drill"
  | "speaking_part1_short"
  | "speaking_part2_cue_card"
  | "speaking_part3_discussion"
  | "review_card"
  | "vocabulary_drill"
  | "grammar_drill";

export type TopicProfile =
  | "general_academic"
  | "law_public_policy"
  | "technology_ai"
  | "business_finance"
  | "medicine_healthcare"
  | "education"
  | "environment_sustainability"
  | "scholarship_applications";

export const TOPIC_PROFILES: TopicProfile[] = [
  "general_academic",
  "law_public_policy",
  "technology_ai",
  "business_finance",
  "medicine_healthcare",
  "education",
  "environment_sustainability",
  "scholarship_applications",
];

export const TOPIC_PROFILE_LABEL: Record<TopicProfile, string> = {
  general_academic: "General academic",
  law_public_policy: "Law / public policy",
  technology_ai: "Technology / AI",
  business_finance: "Business / finance",
  medicine_healthcare: "Medicine / healthcare",
  education: "Education",
  environment_sustainability: "Environment / sustainability",
  scholarship_applications: "Scholarship applications",
};

export type ReviewStatus = "draft" | "approved" | "retired";
export type CopyrightStatus = "original" | "licensed" | "linked";
export type MasteryStatus = "unseen" | "shown" | "in_progress" | "attempted" | "mastered";

export type ContentItem = {
  id: string;
  skill: Skill;
  type: MissionTaskType;
  title: string;
  topicTags: string[];
  profileTags: TopicProfile[];
  difficulty: BandDifficulty;
  estimatedMinutes: number;
  cooldownDays: number;
  reviewStatus: ReviewStatus;
  copyrightStatus: CopyrightStatus;
  // Optional payloads (skill-specific, validated by loader)
  payload?: ListeningPayload | ReadingPayload | WritingPayload | SpeakingPayload | VocabPayload | GrammarPayload | ReviewPayload;
};

export type UserContentState = {
  contentId: string;
  lastShownAt?: string;
  lastStartedAt?: string;
  lastAttemptedAt?: string;
  attempts: number;
  completedCount: number;
  skippedCount: number;
  masteryStatus: MasteryStatus;
  bestScore?: number;
};

// ----------------------------------------------------------------------------
// Skill-specific payloads
// ----------------------------------------------------------------------------

export type ListeningPayload = {
  audioUrl?: string; // empty for stub; TTS-generated later
  transcript: string;
  questions: ListeningQuestion[];
};

export type ListeningQuestion = {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
  type: MissionTaskType;
  distractorNote?: string;
  explanation?: string;
  evidenceTimestamp?: string; // e.g. "01:23"
};

export type ReadingPayload = {
  passage: string;
  questions: ReadingQuestion[];
};

export type ReadingQuestion = {
  id: string;
  prompt: string;
  answer: string;
  type: MissionTaskType;
  evidenceQuote?: string;
  explanation: string;
  options?: string[];
};

export type WritingPayload = {
  prompt: string;
  taskType: "task1" | "task2" | "micro_thesis" | "paragraph_drill";
  minimumWords?: number;
  planningHints?: string[];
  sampleStructure?: string[];
  rubricFocus?: WritingRubricFocus[];
};

export type WritingRubricFocus = "task_response" | "coherence" | "lexical" | "grammar";

export type SpeakingPayload = {
  prompt: string;
  part: 1 | 2 | 3;
  cueCardBullets?: string[]; // Part 2 only
  prepSeconds?: number; // Part 2 only
  speakingSeconds?: number;
  followUps?: string[];
};

export type VocabPayload = {
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  collocations?: string[];
  topic: string;
};

export type GrammarPayload = {
  topic: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  examples: { wrong: string; right: string; note: string }[];
};

// ----------------------------------------------------------------------------
// Mission objects (runtime state)
// ----------------------------------------------------------------------------

export type MissionTask = {
  id: string;
  skill: Skill;
  type: MissionTaskType;
  estimatedMinutes: number;
  difficulty: BandDifficulty;
  status: TaskStatus;
  sourceContentId: string;
  startedAt?: string;
  completedAt?: string;
  elapsedSeconds?: number;
  rescheduledFromDate?: string;
};

export type DailyMission = {
  id: string;
  date: string; // YYYY-MM-DD
  targetMinutes: number;
  focusSkill: FocusSkill;
  tasks: MissionTask[];
  status: MissionStatus;
  startedAt?: string;
  completedAt?: string;
  // first-session specific
  isFirstSession?: boolean;
};

// ----------------------------------------------------------------------------
// Mistakes / Review cards
// ----------------------------------------------------------------------------

export type MistakeCode =
  // Listening (L1–L6)
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
  // Reading (R1–R6)
  | "R1" | "R2" | "R3" | "R4" | "R5" | "R6"
  // Writing (W1–W10)
  | "W1" | "W2" | "W3" | "W4" | "W5" | "W6" | "W7" | "W8" | "W9" | "W10"
  // Speaking (S1–S8)
  | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

export type ReviewMark = "again" | "almost" | "mastered";

export type MistakeCard = {
  id: string;
  userId: string;
  sourceSkill: Skill;
  sourceContentId?: string;
  code: MistakeCode;
  front: string;
  expectedAnswer: string;
  explanation: string;
  // For active recall
  originalExcerpt?: string;
  improvedExcerpt?: string;
  createdAt: string;
  reviewDueAt: string;
  reviewStage: 0 | 1 | 2 | 3; // 0=new, 1=again, 2=almost, 3=mastered
  lastReviewedAt?: string;
  reviewCount: number;
  mastered: boolean;
};

export type ReviewPayload = {
  // For review cards (re-attempt of a saved mistake)
  sourceMistakeId: string;
  cardFront: string;
  cardBack: string;
};

// ----------------------------------------------------------------------------
// AI feedback shapes
// ----------------------------------------------------------------------------

export type WritingFeedback = {
  isDemo?: boolean;
  practiceBandRange: [BandDifficulty, BandDifficulty];
  criteria: {
    taskResponse: { score: number; comment: string };
    coherenceCohesion: { score: number; comment: string };
    lexicalResource: { score: number; comment: string };
    grammaticalRange: { score: number; comment: string };
  };
  topFixes: string[];
  beforeAfter: { before: string; after: string; why: string }[];
  savedMistakes: { code: MistakeCode; excerpt: string; improvedExcerpt: string; note: string }[];
  nextDrill: { type: MissionTaskType; prompt: string };
};

export type SpeakingFeedback = {
  isDemo?: boolean;
  practiceBandRange: [BandDifficulty, BandDifficulty];
  fluencyCoherence: { score: number; comment: string };
  lexicalResource: { score: number; comment: string };
  grammaticalRange: { score: number; comment: string };
  pronunciationEstimate: { score: number; comment: string };
  topHabits: string[];
  betterPhrases: { original: string; better: string }[];
  savedMistakes: { code: MistakeCode; excerpt: string; note: string }[];
  nextPrompt: { type: MissionTaskType; prompt: string };
  transcriptConfidence: "high" | "medium" | "low";
  transcriptEditable: boolean;
};

// ----------------------------------------------------------------------------
// User profile
// ----------------------------------------------------------------------------

export type UserProfile = {
  id: string;
  createdAt: string;
  targetBand: BandDifficulty;
  testDate: "no_date" | "1_month" | "2_3_months" | "4_6_months";
  weakestSkill: Skill | "unknown";
  topicProfile: TopicProfile;
  dailyMinutes: 10 | 15 | 25 | 45;
  onboarded: boolean;
  streakDays: number;
  longestStreak: number;
  lastActiveDate?: string;
};

export type SkipStats = {
  // Per ISO week (YYYY-Www)
  weekKey: string;
  perSkill: Record<Skill, number>;
};

export type DailyStats = {
  date: string; // YYYY-MM-DD
  missionsCompleted: number;
  totalMinutes: number;
  tasksCompleted: number;
  tasksSkipped: number;
  missionsFullyCompleted: number;
  missionsPartiallyCompleted: number;
  minutesStudied: number;
  mistakesSaved: number;
  mistakesReviewed: number;
  skillsCovered: Skill[];
};
