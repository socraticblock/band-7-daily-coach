// ============================================================================
// GRAMMAR DRILLS — 30 items, organized by topic.
// V1 expands to 200. V1.5 to 800.
// ============================================================================

import type { ContentItem } from "@/lib/types";

function grammar(
  id: string,
  topic: string,
  prompt: string,
  correctAnswer: string,
  explanation: string,
  examples: { wrong: string; right: string; note: string }[],
  band: ContentItem["difficulty"] = "band6_0",
): ContentItem {
  return {
    id,
    skill: "grammar",
    type: "grammar_drill",
    title: `Grammar: ${topic}`,
    topicTags: [topic],
    profileTags: ["general_academic"],
    difficulty: band,
    estimatedMinutes: 3,
    cooldownDays: 21,
    reviewStatus: "approved",
    copyrightStatus: "original",
    payload: {
      topic,
      prompt,
      correctAnswer,
      explanation,
      examples,
    },
  };
}

export const GRAMMAR_DRILLS: ContentItem[] = [
  grammar("gra-001", "articles", "Choose the correct option.\n\nThe students completed ___ final exam of the semester.", "their", "'Their' is the possessive form needed here. The article 'the' is already part of 'the final exam'.",
    [
      { wrong: "Students completed the final exam.", right: "The students completed their final exam.", note: "Use a definite article or possessive when the noun is specific to the subject." },
      { wrong: "She is a honest person.", right: "She is an honest person.", note: "'An' is used before vowel sounds." },
    ]),
  grammar("gra-002", "articles", "Fill the gap.\n\nHe is ___ engineer at a large company in Germany.", "an", "Use 'an' before a vowel sound. 'Engineer' begins with /e/, a vowel sound.",
    [
      { wrong: "He is a engineer.", right: "He is an engineer.", note: "Sound, not spelling, determines the article." },
    ]),
  grammar("gra-003", "prepositions", "Choose the correct preposition.\n\nThe policy is focused ___ improving public services.", "on", "'Focused on' is the correct collocation. 'Focused in' is not standard.",
    [
      { wrong: "focused in", right: "focused on", note: "Use 'focused on' to mean concentrating on something." },
      { wrong: "interested of", right: "interested in", note: "Use 'interested in', not 'interested of'." },
    ]),
  grammar("gra-004", "prepositions", "Complete the sentence.\n\nShe has been working here ___ 2018.", "since", "'Since' is used with a point in time. 'For' is used with a duration.",
    [
      { wrong: "for 2018", right: "since 2018", note: "Use 'since' for starting points, 'for' for durations." },
    ]),
  grammar("gra-005", "subject-verb agreement", "Choose the correct form.\n\nThe number of errors in the report ___ small.", "is", "'The number' is the subject. It is singular, so it takes 'is'.",
    [
      { wrong: "A number of students is absent.", right: "A number of students are absent.", note: "'A number of' is plural. 'The number of' is singular." },
    ]),
  grammar("gra-006", "conditionals", "Complete the conditional.\n\nIf the government ___ (invest) more in public transport, traffic would decrease.", "invested", "Second conditional: 'If + past simple, would + base verb'.",
    [
      { wrong: "If government will invest", right: "If the government invested", note: "Second conditional uses past simple in the if-clause." },
    ]),
  grammar("gra-007", "conditionals", "Choose the correct verb form.\n\nIf I ___ (find) a good course, I will enrol.", "find", "First conditional: 'If + present simple, will + base verb'.",
    [
      { wrong: "If I would find", right: "If I find", note: "First conditional uses present simple in the if-clause." },
    ]),
  grammar("gra-008", "relative clauses", "Combine the sentences using a relative clause.\n\nThe professor gave a lecture. She is an expert in climate science.", "The professor, who is an expert in climate science, gave a lecture.", "Use a non-defining relative clause with 'who' + comma for extra information about a known person.",
    [
      { wrong: "The professor that is expert in climate science gave a lecture.", right: "The professor, who is an expert in climate science, gave a lecture.", note: "Use 'who' (not 'that') in non-defining clauses, and add a comma." },
    ]),
  grammar("gra-009", "relative clauses", "Fill the gap.\n\nThe book ___ I read last week was excellent.", "that", "Use 'that' or 'which' for things in defining relative clauses. 'That' is more common in informal and American English.",
    [
      { wrong: "The book where I read", right: "The book that I read", note: "Use 'that/which' for things, not 'where'." },
    ]),
  grammar("gra-010", "passive voice", "Rewrite in the passive voice.\n\nThey built the bridge in 1995.", "The bridge was built in 1995.", "Passive: subject + be + past participle. 'Was built' is correct for a single past action.",
    [
      { wrong: "The bridge is built in 1995.", right: "The bridge was built in 1995.", note: "Use 'was/were + past participle' for past passive." },
    ]),
  grammar("gra-011", "passive voice", "Choose the correct form.\n\nThe report ___ (write) by the team yesterday.", "was written", "Past passive: was/were + past participle.",
    [
      { wrong: "The report written by the team.", right: "The report was written by the team.", note: "Passive needs the auxiliary 'was/were'." },
    ]),
  grammar("gra-012", "comparatives", "Complete the comparison.\n\nThis method is ___ (efficient) than the old one.", "more efficient", "Long adjectives (2+ syllables) form comparatives with 'more', not '-er'.",
    [
      { wrong: "This method is efficenter.", right: "This method is more efficient.", note: "Don't add -er to long adjectives. Use 'more'." },
    ]),
  grammar("gra-013", "comparatives", "Choose the correct form.\n\nOf the two proposals, this one is ___ (good).", "better", "Irregular comparative form: good -> better.",
    [
      { wrong: "more good", right: "better", note: "'Better' is the irregular comparative of 'good'." },
    ]),
  grammar("gra-014", "noun phrases", "Choose the more academic option.\n\nThere is a ___ (big) problem in the sector.", "significant", "Use precise academic vocabulary. 'Significant' is more appropriate than 'big' in formal writing.",
    [
      { wrong: "big problem", right: "significant problem", note: "Prefer precise academic words over general ones." },
    ]),
  grammar("gra-015", "verb patterns", "Choose the correct verb pattern.\n\nShe suggested ___ (go) to the conference.", "going", "After 'suggest', use a gerund: 'suggest doing', not 'suggest to do'.",
    [
      { wrong: "suggested to go", right: "suggested going", note: "Use gerund form after 'suggest'." },
    ]),
  grammar("gra-016", "verb patterns", "Choose the correct verb pattern.\n\nThe manager told the team ___ (finish) the report by Friday.", "to finish", "After 'tell + person', use 'to + infinitive'.",
    [
      { wrong: "told finishing", right: "told to finish", note: "Use 'to + infinitive' after 'told'." },
    ]),
  grammar("gra-017", "linking devices", "Choose the best linking device.\n\nPublic transport is cheap. ___, it is often crowded.", "However", "'However' introduces a contrast. ', and' or 'also' would not show the contrast.",
    [
      { wrong: "Also, it is often crowded.", right: "However, it is often crowded.", note: "Use 'however' for contrast, not 'also'." },
    ]),
  grammar("gra-018", "linking devices", "Complete the sentence.\n\nThe policy has reduced emissions. ___, it has increased energy costs.", "On the other hand", "Phrases like 'on the other hand' present a counterpoint.",
    [
      { wrong: "In addition", right: "On the other hand", note: "'In addition' adds a point; 'on the other hand' introduces a counterpoint." },
    ]),
  grammar("gra-019", "punctuation", "Add punctuation if needed.\n\nThe new policy which was introduced last year has reduced emissions.", "The new policy, which was introduced last year, has reduced emissions.", "Add commas around the non-defining relative clause.",
    [
      { wrong: "The new policy which was introduced last year has reduced emissions.", right: "The new policy, which was introduced last year, has reduced emissions.", note: "Non-defining clauses need commas." },
    ]),
  grammar("gra-020", "punctuation", "Add punctuation if needed.\n\nWe need to act now because the situation is urgent.", "We need to act now; the situation is urgent.", "Use a semicolon to connect two independent clauses without a conjunction.",
    [
      { wrong: "We need to act now the situation is urgent.", right: "We need to act now; the situation is urgent.", note: "Use a semicolon, period, or conjunction between independent clauses." },
    ]),
  grammar("gra-021", "countable vs uncountable", "Choose the correct form.\n\nThere is too ___ (traffic) in the city centre.", "much", "'Traffic' is uncountable, so use 'much' rather than 'many'.",
    [
      { wrong: "too many traffic", right: "too much traffic", note: "Use 'much' with uncountable nouns." },
    ]),
  grammar("gra-022", "countable vs uncountable", "Choose the correct form.\n\nThe number of students ___ increasing.", "is", "'The number of' takes a singular verb. 'A number of' takes a plural verb.",
    [
      { wrong: "are increasing", right: "is increasing", note: "'The number of + singular verb'." },
    ]),
  grammar("gra-023", "modal verbs", "Choose the correct modal verb.\n\nYou ___ (should / must) drive more carefully in this weather.", "should", "'Should' is used for advice. 'Must' is for strong obligation.",
    [
      { wrong: "You must drive more carefully.", right: "You should drive more carefully.", note: "Use 'should' for advice, 'must' for obligation." },
    ]),
  grammar("gra-024", "modal verbs", "Complete the modal sentence.\n\nIf the train is delayed, you ___ (might / must) miss your connection.", "might", "'Might' expresses possibility. 'Must' is too strong.",
    [
      { wrong: "must miss", right: "might miss", note: "Use 'might' for possibility." },
    ]),
  grammar("gra-025", "present perfect vs past simple", "Choose the correct form.\n\nI ___ (live) in this city for ten years.", "have lived", "Present perfect is used for an action that started in the past and continues to the present.",
    [
      { wrong: "I lived here for ten years.", right: "I have lived here for ten years.", note: "Use present perfect with 'for/since' for ongoing situations." },
    ]),
  grammar("gra-026", "present perfect vs past simple", "Choose the correct form.\n\nShe ___ (visit) Paris in 2019.", "visited", "Past simple is used for a finished action at a specific past time.",
    [
      { wrong: "has visited Paris in 2019.", right: "visited Paris in 2019.", note: "Don't use present perfect with specific past times." },
    ]),
  grammar("gra-027", "reported speech", "Rewrite in reported speech.\n\nHe said, 'I am tired.'", "He said (that) he was tired.", "In reported speech, present simple becomes past simple.",
    [
      { wrong: "He said he is tired.", right: "He said he was tired.", note: "Tense shifts back in reported speech." },
    ]),
  grammar("gra-028", "reported speech", "Rewrite in reported speech.\n\nShe said, 'I will go to the meeting.'", "She said (that) she would go to the meeting.", "'Will' becomes 'would' in reported speech.",
    [
      { wrong: "She said she will go.", right: "She said she would go.", note: "'Will' -> 'would' in reported speech." },
    ]),
  grammar("gra-029", "gerund vs infinitive", "Choose the correct form.\n\nI enjoy ___ (read) in the evening.", "reading", "After 'enjoy', use the gerund form.",
    [
      { wrong: "enjoy to read", right: "enjoy reading", note: "Use gerund after 'enjoy'." },
    ]),
  grammar("gra-030", "gerund vs infinitive", "Choose the correct form.\n\nShe wants ___ (study) law.", "to study", "After 'want', use 'to + infinitive'.",
    [
      { wrong: "wants studying", right: "wants to study", note: "Use 'to + infinitive' after 'want'." },
    ]),
];
