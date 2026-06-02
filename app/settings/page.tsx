"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { clearAllStorage } from "@/lib/storage";
import { useProfile, TOPIC_PROFILES, TOPIC_PROFILE_LABEL } from "@/lib/app-state";
import type { BandDifficulty, TopicProfile } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useProfile();

  return (
    <AppShell>
      <div className="mb-6">
        <p className="label">Settings</p>
        <h1 className="mt-1 font-serif text-title">Adjust your daily plan.</h1>
      </div>

      <div className="card p-5">
        <p className="label">Target band</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["band6_5", "band7_0", "band7_5", "band8_0"] as BandDifficulty[]).map((b) => (
            <button
              key={b}
              onClick={() => setProfile({ ...profile, targetBand: b })}
              className={`btn btn-sm ${profile.targetBand === b ? "btn-primary" : "btn-ghost"}`}
            >
              {b.replace("band", "Band ")}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 p-5">
        <p className="label">Topic profile</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOPIC_PROFILES.map((p: TopicProfile) => (
            <button
              key={p}
              onClick={() => setProfile({ ...profile, topicProfile: p })}
              className={`btn btn-sm justify-start ${profile.topicProfile === p ? "btn-primary" : "btn-ghost"}`}
            >
              {TOPIC_PROFILE_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 p-5">
        <p className="label">Daily time</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([10, 15, 25, 45] as const).map((t) => (
            <button
              key={t}
              onClick={() => setProfile({ ...profile, dailyMinutes: t })}
              className={`btn btn-sm ${profile.dailyMinutes === t ? "btn-primary" : "btn-ghost"}`}
            >
              {t} min
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 p-5">
        <p className="label">Privacy</p>
        <p className="mt-2 text-small text-ink-muted">
          Review how local prototype data and AI feedback submissions are handled.
        </p>
        <Link href="/privacy" className="btn-ghost btn-sm mt-3 inline-flex">
          Privacy details
        </Link>
      </div>

      <div className="card mt-5 border-error/30 p-5">
        <p className="label text-error">Danger zone</p>
        <p className="mt-2 text-small text-ink-muted">
          Reset will clear all local data including onboarding, mistakes, and feedback history.
        </p>
        <button
          onClick={() => {
            if (confirm("Reset all local data? This cannot be undone.")) {
              clearAllStorage();
              window.location.href = "/onboarding";
            }
          }}
          className="btn btn-sm mt-3 border-error/50 text-error hover:bg-error/5"
        >
          Reset all local data
        </button>
      </div>
    </AppShell>
  );
}
