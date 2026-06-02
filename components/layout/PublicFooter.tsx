import Link from "next/link";
import { Disclaimer } from "@/components/ui/Disclaimer";

export function PublicFooter() {
  return (
    <footer>
      <div className="container-page py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="font-semibold">Band 7 Daily Coach</div>
            <p className="mt-2 max-w-xs text-small text-ink-muted">
              Independent IELTS Academic preparation for students aiming for Band 7+.
            </p>
          </div>
          <div>
            <div className="label mb-3">Product</div>
            <ul className="space-y-2 text-small">
              <li><Link href="/band-7" className="hover:text-ink">Band 7 / C1</Link></li>
              <li><Link href="/how-it-works" className="hover:text-ink">How it works</Link></li>
              <li><Link href="/onboarding" className="hover:text-ink">Start</Link></li>
            </ul>
          </div>
          <div>
            <div className="label mb-3">Legal</div>
            <ul className="space-y-2 text-small">
              <li><Link href="/legal" className="hover:text-ink">Disclaimer</Link></li>
              <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <Disclaimer />
    </footer>
  );
}
