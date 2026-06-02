// ============================================================================
// SPEAKING PROMPTS — Part 1 / Part 2 cue cards / Part 3.
// 50 prompts for prototype. V1 expands to 200+ Part 1, 60+ Part 2, 200+ Part 3.
// All original. Profile-aware via topicTags / profileTags.
// ============================================================================

import type { ContentItem } from "@/lib/types";

function part1(prompt: string, topics: string[], profiles: ContentItem["profileTags"], band: ContentItem["difficulty"] = "band6_0", id: string): ContentItem {
  return {
    id,
    skill: "speaking",
    type: "speaking_part1_short",
    title: `Part 1: ${prompt.slice(0, 50)}...`,
    topicTags: topics,
    profileTags: profiles,
    difficulty: band,
    estimatedMinutes: 2,
    cooldownDays: 14,
    reviewStatus: "approved",
    copyrightStatus: "original",
    payload: {
      taskType: undefined as never,
      prompt,
      part: 1,
      speakingSeconds: 45,
    } as ContentItem["payload"],
  };
}

function part2(id: string, cueCard: string, bullets: string[], topics: string[], profiles: ContentItem["profileTags"], band: ContentItem["difficulty"] = "band6_5"): ContentItem {
  return {
    id,
    skill: "speaking",
    type: "speaking_part2_cue_card",
    title: `Part 2: ${cueCard.slice(0, 50)}...`,
    topicTags: topics,
    profileTags: profiles,
    difficulty: band,
    estimatedMinutes: 3,
    cooldownDays: 30,
    reviewStatus: "approved",
    copyrightStatus: "original",
    payload: {
      taskType: undefined as never,
      prompt: cueCard,
      part: 2,
      cueCardBullets: bullets,
      prepSeconds: 60,
      speakingSeconds: 120,
    } as ContentItem["payload"],
  };
}

function part3(prompt: string, topics: string[], profiles: ContentItem["profileTags"], band: ContentItem["difficulty"] = "band6_5", id: string): ContentItem {
  return {
    id,
    skill: "speaking",
    type: "speaking_part3_discussion",
    title: `Part 3: ${prompt.slice(0, 50)}...`,
    topicTags: topics,
    profileTags: profiles,
    difficulty: band,
    estimatedMinutes: 3,
    cooldownDays: 14,
    reviewStatus: "approved",
    copyrightStatus: "original",
    payload: {
      taskType: undefined as never,
      prompt,
      part: 3,
      speakingSeconds: 90,
    } as ContentItem["payload"],
  };
}

export const SPEAKING_PROMPTS: ContentItem[] = [
  // Part 1 — 20 questions
  part1("Do you work or are you a student?", ["work", "study"], ["general_academic", "scholarship_applications"], "band5_5", "spk-p1-001"),
  part1("What do you like most about your job or studies?", ["work", "study"], ["general_academic"], "band5_5", "spk-p1-002"),
  part1("Why did you choose your field of study?", ["study", "career"], ["general_academic", "scholarship_applications", "law_public_policy"], "band6_0", "spk-p1-003"),
  part1("Do you prefer to work alone or in a team?", ["work"], ["general_academic", "business_finance"], "band5_5", "spk-p1-004"),
  part1("How do you usually relax after work or study?", ["lifestyle", "health"], ["general_academic"], "band5_5", "spk-p1-005"),
  part1("Do you enjoy reading? What kinds of books do you like?", ["reading", "education"], ["general_academic", "education"], "band5_5", "spk-p1-006"),
  part1("What kind of music do you listen to?", ["culture"], ["general_academic"], "band5_5", "spk-p1-007"),
  part1("How often do you cook at home?", ["lifestyle"], ["general_academic"], "band5_5", "spk-p1-008"),
  part1("Do you use any apps to help you study or work?", ["technology"], ["general_academic", "technology_ai"], "band6_0", "spk-p1-009"),
  part1("How do you usually get news?", ["media"], ["general_academic"], "band6_0", "spk-p1-010"),
  part1("Have you ever lived in a different city from your hometown?", ["cities", "travel"], ["general_academic"], "band6_0", "spk-p1-011"),
  part1("Do you prefer to plan things carefully or be spontaneous?", ["lifestyle"], ["general_academic"], "band6_0", "spk-p1-012"),
  part1("What is your favourite season, and why?", ["weather", "lifestyle"], ["general_academic"], "band5_5", "spk-p1-013"),
  part1("How do you celebrate important occasions with family?", ["culture", "family"], ["general_academic"], "band6_0", "spk-p1-014"),
  part1("Do you think it is important to learn other languages?", ["education", "language"], ["general_academic", "education", "scholarship_applications"], "band6_0", "spk-p1-015"),
  part1("How do you keep healthy?", ["health", "lifestyle"], ["general_academic", "medicine_healthcare"], "band6_0", "spk-p1-016"),
  part1("What changes would you like to see in your city?", ["cities", "society"], ["general_academic", "law_public_policy", "environment_sustainability"], "band6_5", "spk-p1-017"),
  part1("Do you think technology makes life easier or more complicated?", ["technology"], ["general_academic", "technology_ai"], "band6_5", "spk-p1-018"),
  part1("How do you handle disagreements with other people?", ["communication"], ["general_academic", "business_finance", "law_public_policy"], "band6_5", "spk-p1-019"),
  part1("Do you think young people have enough opportunities today?", ["society", "work"], ["general_academic", "scholarship_applications"], "band6_5", "spk-p1-020"),

  // Part 2 — 10 cue cards
  part2("spk-p2-001", "Describe a law or rule that you think is important.", ["what the law is", "how you learned about it", "who it affects", "why you think it is important"], ["law", "society"], ["law_public_policy", "scholarship_applications"], "band7_0"),
  part2("spk-p2-002", "Describe a teacher or mentor who had an important influence on you.", ["who the person was", "how you knew them", "what they taught you", "why they were important"], ["education", "people"], ["general_academic", "education"], "band6_5"),
  part2("spk-p2-003", "Describe a place in your country that you would recommend to visitors.", ["where it is", "what visitors can do there", "how you first visited", "why you recommend it"], ["travel", "culture"], ["general_academic"], "band6_5"),
  part2("spk-p2-004", "Describe a time when you used technology to solve a problem.", ["what the problem was", "what technology you used", "how you used it", "what the result was"], ["technology"], ["general_academic", "technology_ai", "scholarship_applications"], "band6_5"),
  part2("spk-p2-005", "Describe a public service in your country that has improved in recent years.", ["what the service is", "how it changed", "who benefits", "why you think it improved"], ["society", "policy"], ["general_academic", "law_public_policy", "scholarship_applications"], "band7_0"),
  part2("spk-p2-006", "Describe a goal that you have set yourself for the next year.", ["what the goal is", "why you chose it", "how you will reach it", "what support you will need"], ["personal", "work"], ["general_academic", "scholarship_applications", "business_finance"], "band6_5"),
  part2("spk-p2-007", "Describe a moment when you had to make a difficult decision.", ["what the decision was", "what options you considered", "what you decided", "what you learned"], ["personal", "decision-making"], ["general_academic", "law_public_policy", "business_finance", "scholarship_applications"], "band7_0"),
  part2("spk-p2-008", "Describe a book or article that changed how you think about something.", ["what the book or article was", "when you read it", "what it argued", "how it changed your thinking"], ["reading", "education"], ["general_academic", "education", "scholarship_applications"], "band7_0"),
  part2("spk-p2-009", "Describe a project or piece of work that you are proud of.", ["what it was", "what your role was", "what challenges you faced", "what you learned"], ["work", "study"], ["general_academic", "scholarship_applications", "business_finance"], "band6_5"),
  part2("spk-p2-010", "Describe a place in your city where you go to think or relax.", ["where it is", "what it looks like", "how often you go there", "why it matters to you"], ["cities", "lifestyle"], ["general_academic"], "band6_0"),

  // Part 3 — 20 discussion prompts
  part3("Should governments regulate new technologies more strictly?", ["law", "technology"], ["law_public_policy", "technology_ai"], "band7_0", "spk-p3-001"),
  part3("How can countries balance innovation with public safety?", ["law", "technology", "policy"], ["law_public_policy", "technology_ai"], "band7_0", "spk-p3-002"),
  part3("Do laws change society, or does society change laws?", ["law", "society"], ["law_public_policy", "scholarship_applications"], "band7_0", "spk-p3-003"),
  part3("What are the advantages and risks of moving public services online?", ["technology", "policy"], ["technology_ai", "law_public_policy"], "band7_0", "spk-p3-004"),
  part3("How should governments balance individual privacy with national security?", ["law", "society"], ["law_public_policy"], "band7_0", "spk-p3-005"),
  part3("What role should international organisations play in setting technology rules?", ["law", "technology"], ["law_public_policy", "technology_ai", "scholarship_applications"], "band7_0", "spk-p3-006"),
  part3("Is higher education still worth the cost in many countries?", ["education"], ["education", "scholarship_applications"], "band7_0", "spk-p3-007"),
  part3("How do you think schools will change in the next twenty years?", ["education", "technology"], ["education", "technology_ai"], "band6_5", "spk-p3-008"),
  part3("What are the most important qualities for a good teacher?", ["education"], ["education"], "band6_5", "spk-p3-009"),
  part3("How can cities reduce traffic and pollution at the same time?", ["cities", "environment"], ["environment_sustainability", "law_public_policy"], "band7_0", "spk-p3-010"),
  part3("Should the government provide free public transport in major cities?", ["cities", "policy"], ["environment_sustainability", "law_public_policy"], "band7_0", "spk-p3-011"),
  part3("How do you think working from home will change in the next ten years?", ["work", "technology"], ["business_finance", "technology_ai"], "band6_5", "spk-p3-012"),
  part3("What makes a workplace healthy for employees?", ["work", "health"], ["business_finance", "medicine_healthcare"], "band6_5", "spk-p3-013"),
  part3("How do you think AI will change jobs that exist today?", ["technology", "work"], ["technology_ai", "business_finance", "scholarship_applications"], "band7_0", "spk-p3-014"),
  part3("What are the biggest healthcare challenges in your country?", ["health"], ["medicine_healthcare"], "band6_5", "spk-p3-015"),
  part3("How can people be encouraged to live more sustainably?", ["environment"], ["environment_sustainability"], "band6_5", "spk-p3-016"),
  part3("What role does media play in shaping public opinion?", ["media", "society"], ["law_public_policy"], "band7_0", "spk-p3-017"),
  part3("How do cultural traditions influence the way younger generations live?", ["culture", "society"], ["general_academic"], "band6_5", "spk-p3-018"),
  part3("What makes a scholarship application stand out?", ["scholarship", "education"], ["scholarship_applications", "education"], "band7_0", "spk-p3-019"),
  part3("How important is international experience for young professionals today?", ["career", "education"], ["scholarship_applications", "business_finance"], "band6_5", "spk-p3-020"),
];
