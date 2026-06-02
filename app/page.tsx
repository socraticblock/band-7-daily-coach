import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function LandingPage() {
  return (
    <>
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="container-page py-16 sm:py-24">
          <div className="max-w-reading">
            <p className="label mb-4">Independent IELTS Academic preparation</p>
            <h1 className="font-serif text-display">
              Reach Band 7+ with one focused mission a day.
            </h1>
            <p className="mt-6 text-body text-ink-muted">
              Band 7 Daily Coach tells you exactly what to study, gives rubric-anchored
              feedback, saves your mistakes, and brings them back until you master them.
              No planning. No guesswork. One clear mission each day.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding" className="btn-accent">Start today&apos;s mission</Link>
              <Link href="/how-it-works" className="btn-ghost">See how it works</Link>
            </div>
            <p className="mt-4 text-tiny text-ink-subtle">
              Computer-first, mobile-friendly. Designed for daily practice.
            </p>
          </div>
        </section>

        {/* Mission preview */}
        <section className="border-y border-line bg-paper-warm">
          <div className="container-page py-16">
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
              <div>
                <p className="label mb-3">Today&apos;s mission</p>
                <h2 className="text-title">18 minutes. Five focused steps.</h2>
                <p className="mt-3 text-body text-ink-muted">
                  You never choose what to study. The app picks it for you, based on your
                  target band, weakest skill, and the mistakes you saved last time.
                </p>
              </div>
              <div className="card p-6">
                <ol className="space-y-3 text-small">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-tiny text-accent">1</span>
                    <div>
                      <div className="font-medium">Reading — True / False / Not Given</div>
                      <div className="text-ink-muted">7 min</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-tiny text-accent">2</span>
                    <div>
                      <div className="font-medium">Writing — improve one thesis</div>
                      <div className="text-ink-muted">5 min</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-tiny text-accent">3</span>
                    <div>
                      <div className="font-medium">Speaking — one Part 1 question</div>
                      <div className="text-ink-muted">3 min</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-tiny text-accent">4</span>
                    <div>
                      <div className="font-medium">Review — 3 saved mistakes</div>
                      <div className="text-ink-muted">3 min</div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Why this works */}
        <section className="container-page py-16">
          <div className="mb-10 max-w-reading">
            <p className="label mb-3">Why it works</p>
            <h2 className="text-title">Five things ChatGPT alone cannot do for you.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Structure", d: "You do not need to decide what to study. The app chooses today's work for you." },
              { t: "Habit", d: "A daily mission, a streak, and a short, predictable rhythm." },
              { t: "Memory", d: "Your mistakes are saved and returned through active recall until you master them." },
              { t: "Exam realism", d: "Timers, typed writing, audio, answer fields, and mock mode — built for computer IELTS." },
              { t: "Personalization", d: "Topics adapt to your background — law, technology, business, healthcare, education, or general academic." },
              { t: "Rubric-anchored feedback", d: "AI feedback follows the official IELTS criteria and gives concrete before/after rewrites." },
            ].map((f) => (
              <div key={f.t} className="card p-6">
                <div className="font-medium">{f.t}</div>
                <p className="mt-2 text-small text-ink-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Band 7 / C1 */}
        <section className="border-t border-line bg-paper-warm">
          <div className="container-page py-16">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="label mb-3">Why Band 7+</p>
                <h2 className="text-title">The safer target for C1.</h2>
                <p className="mt-3 text-body text-ink-muted">
                  IELTS scores do not align exactly with the Common European Framework.
                  The C1 threshold falls between Band 6.5 and Band 7.0 — and some 6.5
                  test takers are still slightly below C1. For university, scholarship,
                  and professional registration, Band 7.0+ is the safer practical target.
                </p>
                <Link href="/band-7" className="mt-4 inline-block text-small text-accent hover:underline">
                  Read more on Band 7 / C1 →
                </Link>
              </div>
              <div className="card p-6">
                <div className="label mb-3">What V1 covers</div>
                <ul className="space-y-2 text-small">
                  <li>• Listening — Parts 1 to 4, all question types</li>
                  <li>• Reading — academic passages, TFNG, matching, completion</li>
                  <li>• Writing — Task 1 and Task 2 with rubric feedback</li>
                  <li>• Speaking — Parts 1, 2, 3 with transcript review</li>
                  <li>• Error Notebook with active recall</li>
                  <li>• Mini and full mocks</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container-page py-16">
          <div className="card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-title">Open the app tomorrow with coffee.</div>
              <p className="mt-2 text-small text-ink-muted">
                Onboarding takes 90 seconds. The first mission is short on purpose.
              </p>
            </div>
            <Link href="/onboarding" className="btn-accent">Start onboarding</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
