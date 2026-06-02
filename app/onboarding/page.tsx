"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile, TOPIC_PROFILES, TOPIC_PROFILE_LABEL } from "@/lib/app-state";
import type { BandDifficulty, TopicProfile, Skill } from "@/lib/types";

const TARGETS: { v: BandDifficulty; label: string }[] = [
  { v: "band6_5", label: "6.5" },
  { v: "band7_0", label: "7.0" },
  { v: "band7_5", label: "7.5" },
  { v: "band7_0", label: "Not sure (default 7.0)" },
];
const DATES = [
  { v: "no_date", label: "No date yet" },
  { v: "1_month", label: "Within 1 month" },
  { v: "2_3_months", label: "2–3 months" },
  { v: "4_6_months", label: "4–6 months" },
] as const;
const WEAK: { v: Skill | "unknown"; label: string }[] = [
  { v: "listening", label: "Listening" },
  { v: "reading", label: "Reading" },
  { v: "writing", label: "Writing" },
  { v: "speaking", label: "Speaking" },
  { v: "unknown", label: "I don't know" },
];
const TIMES = [10, 15, 25, 45] as const;

export default function OnboardingPage() {
  const [profile, setProfile] = useProfile();
  const [step, setStep] = useState(0);
  const router = useRouter();

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const updated = { ...profile, onboarded: true };
    setProfile(updated);
    // Write synchronously so the next page sees the updated profile on first read.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("b7dc.profile", JSON.stringify(updated));
      } catch {
        // ignore quota errors
      }
    }
    router.push("/dashboard");
  };

  return (
    <main className="container-page py-12">
      <div className="mx-auto max-w-reading">
        <p className="label mb-3">Setup · 90 seconds</p>
        <h1 className="font-serif text-title">Let&apos;s set up your daily coach.</h1>
        <p className="mt-2 text-small text-ink-muted">
          {step + 1} of 5
        </p>

        <div className="mt-8 card p-6 sm:p-8">
          {step === 0 && (
            <fieldset>
              <legend className="text-subtitle font-semibold">1. What score are you aiming for?</legend>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { v: "band6_5" as BandDifficulty, label: "6.5" },
                  { v: "band7_0" as BandDifficulty, label: "7.0" },
                  { v: "band7_5" as BandDifficulty, label: "7.5" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setProfile({ ...profile, targetBand: o.v })}
                    className={`btn ${profile.targetBand === o.v ? "btn-primary" : "btn-ghost"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-tiny text-ink-subtle">
                Not sure? Leave the default (7.0) and change it later in Settings.
              </p>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="text-subtitle font-semibold">2. When is your exam?</legend>
              <div className="mt-4 grid gap-3">
                {DATES.map((d) => (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => setProfile({ ...profile, testDate: d.v })}
                    className={`btn justify-start ${profile.testDate === d.v ? "btn-primary" : "btn-ghost"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="text-subtitle font-semibold">3. Which skill feels weakest?</legend>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {WEAK.map((w) => (
                  <button
                    key={w.v}
                    type="button"
                    onClick={() => setProfile({ ...profile, weakestSkill: w.v })}
                    className={`btn ${profile.weakestSkill === w.v ? "btn-primary" : "btn-ghost"}`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset>
              <legend className="text-subtitle font-semibold">4. What background should examples use?</legend>
              <p className="mt-1 text-tiny text-ink-subtle">
                General IELTS topics remain the base. Your profile gets up-weighted.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TOPIC_PROFILES.map((p: TopicProfile) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProfile({ ...profile, topicProfile: p })}
                    className={`btn justify-start ${profile.topicProfile === p ? "btn-primary" : "btn-ghost"}`}
                  >
                    {TOPIC_PROFILE_LABEL[p]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <fieldset>
              <legend className="text-subtitle font-semibold">5. How much can you study daily?</legend>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setProfile({ ...profile, dailyMinutes: t })}
                    className={`btn ${profile.dailyMinutes === t ? "btn-primary" : "btn-ghost"}`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
              <p className="mt-3 text-tiny text-ink-subtle">
                You can change this later in Settings.
              </p>
            </fieldset>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={prev} className="btn-ghost btn-sm" disabled={step === 0}>
            Back
          </button>
          {step < 4 ? (
            <button onClick={next} className="btn-accent btn-sm">
              Next
            </button>
          ) : (
            <button onClick={finish} className="btn-accent btn-sm">
              Finish setup
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
