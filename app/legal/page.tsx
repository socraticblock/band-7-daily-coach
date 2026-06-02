import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata = { title: "Disclaimer — Band 7 Daily Coach" };

export default function LegalPage() {
  return (
    <>
      <PublicNav />
      <main className="container-page py-16">
        <div className="max-w-reading">
          <p className="label mb-3">Disclaimer</p>
          <h1 className="font-serif text-title">Independence and trademarks.</h1>
          <div className="mt-8 space-y-5 text-body text-ink-muted">
            <p>
              Band 7 Daily Coach is an independent preparation tool. It is not affiliated
              with, endorsed by, or approved by the IELTS Partners, British Council,
              IDP IELTS, or Cambridge University Press &amp; Assessment.
            </p>
            <p>
              IELTS is a registered trademark of its respective owners. This website
              provides independent IELTS Academic preparation materials. The word
              &quot;IELTS&quot; is used descriptively to indicate the exam the materials prepare for.
            </p>
            <p>
              All practice materials on this site are original. No official IELTS test
              papers, British Council/IDP/Cambridge sample tests, paid course content,
              YouTube transcripts, or third-party audio are copied, downloaded,
              rehosted, or modified.
            </p>
            <p>
              Practice band estimates shown in the app are estimates only. They are not
              official IELTS scores and should not be presented as such to any
              institution.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
