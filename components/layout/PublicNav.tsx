import Link from "next/link";

export function PublicNav() {
  return (
    <header className="border-b border-line bg-paper-card">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
          <span>Band 7 Daily Coach</span>
        </Link>
        <nav className="flex items-center gap-1 text-small text-ink-muted sm:gap-2">
          <Link href="/band-7" className="rounded px-2.5 py-1.5 hover:text-ink">Band 7 / C1</Link>
          <Link href="/how-it-works" className="hidden rounded px-2.5 py-1.5 hover:text-ink sm:inline-block">How it works</Link>
          <Link href="/onboarding" className="btn-accent btn-sm">Start</Link>
        </nav>
      </div>
    </header>
  );
}
