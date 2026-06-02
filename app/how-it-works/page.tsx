import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata = { title: "How it works — Band 7 Daily Coach" };

export default function HowItWorksPage() {
  const steps = [
    { t: "Onboarding", d: "5 questions: target band, test date, weakest skill, topic profile, daily time. 90 seconds." },
    { t: "First mission", d: "Hand-tuned. 10 minutes max. One Reading question, one Writing micro-prompt, one review card." },
    { t: "Daily missions", d: "15-25 minutes. The app picks today's work from your weak skill, a receptive task, a productive task, and due mistake reviews." },
    { t: "Feedback", d: "Rubric-anchored AI feedback with band range, 4 criteria, before/after rewrites, and saved mistakes." },
    { t: "Error Notebook", d: "Active recall, not a list. Top 2-3 mistakes per submission, capped at 8-10 cards per day." },
    { t: "Progress", d: "Practice readiness per skill, streak, mistakes mastered, mock trend." },
  ];
  return (
    <>
      <PublicNav />
      <main className="container-page py-16">
        <div className="max-w-reading">
          <p className="label mb-3">How it works</p>
          <h1 className="font-serif text-display">Six steps, one rhythm.</h1>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.t} className="card p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-small text-ink-subtle">0{i + 1}</span>
                <div className="text-subtitle font-semibold">{s.t}</div>
              </div>
              <p className="mt-2 text-small text-ink-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Link href="/onboarding" className="btn-accent">Start onboarding</Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
