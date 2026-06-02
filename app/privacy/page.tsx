import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata = { title: "Privacy - Band 7 Daily Coach" };

export default function PrivacyPage() {
  return (
    <>
      <PublicNav />
      <main className="container-page py-16">
        <div className="max-w-reading">
          <p className="label mb-3">Privacy</p>
          <h1 className="font-serif text-title">How prototype data is handled.</h1>
          <div className="mt-8 space-y-5 text-body text-ink-muted">
            <p>
              Band 7 Daily Coach is currently a localStorage prototype. Your profile,
              missions, draft progress, feedback history, and Error Notebook cards are
              stored in this browser on this device.
            </p>
            <p>
              Writing answers may be sent to an AI provider to generate feedback.
              Speaking audio may be sent for transcription, and speaking transcripts
              may be sent for feedback. Do not submit sensitive personal information.
            </p>
            <p>
              Prototype practice data is not sold. The app does not add advertising
              trackers or analytics cookies.
            </p>
            <p>
              Practice band estimates are learning aids only. They are not official
              IELTS scores and should not be presented to an institution as official
              results.
            </p>
            <p>
              To reset local data, open <Link href="/settings" className="text-accent hover:underline">Settings</Link> and use
              Reset all local data. This clears Band 7 Daily Coach data from this browser.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
