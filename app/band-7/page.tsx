import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata = { title: "Band 7 / C1 — Band 7 Daily Coach" };

export default function Band7Page() {
  return (
    <>
      <PublicNav />
      <main className="container-page py-16">
        <div className="max-w-reading">
          <p className="label mb-3">Why Band 7+</p>
          <h1 className="font-serif text-display">The C1 target that actually feels safe.</h1>
          <div className="prose-academic mt-8 space-y-5 text-body text-ink-muted">
            <p>
              IELTS scores do not map one-to-one onto the Common European Framework of
              Reference for Languages (CEFR). The C1 minimum threshold falls between
              Band 6.5 and Band 7.0 — and some 6.5 test takers may still be slightly
              below C1.
            </p>
            <p>
              For university admission, scholarship applications, and professional
              registration, Band 7.0+ is the safer target. It leaves less to interpretation
              by the institution reviewing the score.
            </p>
            <h2 className="pt-4 text-subtitle text-ink">What Band 7 means in practice</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>You can follow complex academic arguments.</li>
              <li>You can produce clear, well-organised writing on unfamiliar topics.</li>
              <li>You can speak at length with relatively few errors.</li>
              <li>You understand implied meaning in reading and listening.</li>
            </ul>
            <h2 className="pt-4 text-subtitle text-ink">How the product targets it</h2>
            <p>
              Daily missions rotate across all four skills with weighted difficulty
              toward your target band. Mistakes are saved in a closed 30-code taxonomy
              and returned through active recall until mastered. Practice band estimates
              are not official IELTS scores — they help you track readiness.
            </p>
            <p>
              <Link href="/onboarding" className="text-accent hover:underline">Start onboarding →</Link>
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
