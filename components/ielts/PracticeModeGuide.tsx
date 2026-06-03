type PracticeModeGuideProps = {
  skill: "listening" | "reading" | "writing" | "speaking";
};

type GuideContent = {
  title: string;
  context: string;
  steps: string[];
  tip: string;
};

const GUIDES: Record<PracticeModeGuideProps["skill"], GuideContent> = {
  listening: {
    title: "IELTS Listening",
    context:
      "In the real IELTS Listening test, you see the questions while you listen. The recording is played once only, and the answers usually come in the same order as the audio.",
    steps: [
      "Read the questions first.",
      "Press play and answer while listening.",
      "Try to listen once before replaying.",
      "Check your answers.",
      "Review the transcript only after you finish.",
    ],
    tip: "Pay attention to spelling, numbers, names, word limits, and distractors.",
  },
  reading: {
    title: "IELTS Reading",
    context:
      "In the real IELTS Academic Reading test, you answer 40 questions in 60 minutes. There is no extra transfer time.",
    steps: [
      "Read the questions before or while reading the passage.",
      "Use only information in the text.",
      "Do not use outside knowledge.",
      "Check your answers after you finish.",
      "Review the explanation and evidence.",
    ],
    tip: "For True / False / Not Given: True = the text agrees. False = the text contradicts it. Not Given = the text does not say.",
  },
  writing: {
    title: "IELTS Writing",
    context:
      "In the real IELTS Academic Writing test, you complete two tasks in 60 minutes. Task 1 is at least 150 words. Task 2 is at least 250 words and counts twice as much.",
    steps: [
      "Read the prompt carefully.",
      "Plan briefly before writing.",
      "Write in full sentences, not notes or bullet points.",
      "Submit when ready.",
      "Use the feedback to improve your next answer.",
    ],
    tip: "This is a practice estimate, not an official IELTS score.",
  },
  speaking: {
    title: "IELTS Speaking",
    context:
      "In the real IELTS Speaking test, you speak with an examiner and the test is recorded. Part 1 is familiar questions. Part 2 gives you 1 minute to prepare and up to 2 minutes to speak. Part 3 is a deeper discussion.",
    steps: [
      "Read the prompt.",
      "Record your answer.",
      "Check the transcript.",
      "Correct transcription mistakes.",
      "Generate feedback.",
    ],
    tip: "Pronunciation feedback is AI-estimated, not examiner-grade.",
  },
};

export function PracticeModeGuide({ skill }: PracticeModeGuideProps) {
  const guide = GUIDES[skill];

  return (
    <div className="card border-accent/30 bg-accent/5 p-5 text-small">
      <p className="label text-accent">Practice mode</p>
      <h2 className="mt-1 font-serif text-subtitle">{guide.title}</h2>
      <p className="mt-2 text-ink-muted">{guide.context}</p>
      <p className="mt-3 font-medium text-ink">For practice today:</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-muted">
        {guide.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="mt-3 text-tiny text-ink-subtle">{guide.tip}</p>
    </div>
  );
}
