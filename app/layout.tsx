import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Band 7 Daily Coach — Independent IELTS Academic preparation",
  description:
    "Daily IELTS Academic practice for students aiming for Band 7+. Focused missions, mistake memory, active review.",
  applicationName: "Band 7 Daily Coach",
  robots: { index: false, follow: false }, // V0.1 — keep private until launch
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
