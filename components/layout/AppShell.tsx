"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disclaimer } from "@/components/ui/Disclaimer";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/daily", label: "Daily" },
  { href: "/writing", label: "Writing" },
  { href: "/speaking", label: "Speaking" },
  { href: "/listening", label: "Listening" },
  { href: "/reading", label: "Reading" },
  { href: "/mistakes", label: "Notebook" },
  { href: "/progress", label: "Progress" },
  { href: "/privacy", label: "Privacy" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-paper-card/95 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-small font-semibold">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span>Band 7 Daily Coach</span>
          </Link>
          <nav className="hidden items-center gap-1 text-small sm:flex">
            {NAV.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded px-2.5 py-1.5 transition-colors ${
                    active ? "bg-paper-warm text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <Link href="/settings" className="ml-1 rounded px-2.5 py-1.5 text-ink-subtle hover:text-ink">
              ⚙
            </Link>
          </nav>
        </div>
        {/* Mobile nav */}
        <div className="border-t border-line sm:hidden">
          <div className="container-page flex gap-1 overflow-x-auto py-2 text-tiny">
            {NAV.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`shrink-0 rounded px-2.5 py-1 ${
                    active ? "bg-paper-warm text-ink" : "text-ink-muted"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      <main className="container-page py-6 sm:py-10">{children}</main>
      <Disclaimer />
    </div>
  );
}
