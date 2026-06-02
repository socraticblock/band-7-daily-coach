# Band 7 Daily Coach

> Independent IELTS Academic preparation for students aiming for Band 7+ / C1-level English.

A scalable product that starts private. Daily missions, rubric-anchored AI feedback, mistake memory, and active recall — built for computer-first IELTS practice from mid-2026 onwards.

## North star (one page)

**Who:** IELTS Academic students aiming for Band 7+ / C1-level English.
**First real tester:** one serious student. Product is not built only for that person.
**What:** A daily coach that tells the student what to study, gives focused feedback, saves mistakes, and brings them back through active review.
**Why:** Removes study-planning confusion. Builds consistent exam preparation.
**30-day success:** The first tester completes 18–22 missions in 30 days and uses the Error Notebook repeatedly.

## How the product beats "just ask ChatGPT"

1. **Structure** — the app picks today's work, not the user.
2. **Habit** — daily mission, streak, predictable rhythm.
3. **Memory** — saved mistakes return through active recall.
4. **Exam realism** — typed writing, audio, timers, answer fields, mock mode.
5. **Personalization** — topic profile weighting without becoming niche-only.

## Status

This is **V0.1 — prototype**. The daily loop is wired, the mission engine works, the mistake taxonomy is closed, the writing/speaking feedback flow runs end-to-end, the listening/reading trainers are stubbed. Content depth is intentionally thin (see roadmap below). TTS audio is not yet generated.

## Quick start

```bash
cd band-7-daily-coach
npm install
npm run dev
```

Open http://localhost:3000.

Without API keys, the AI feedback routes return a structured mock so the full UX is testable. To enable real AI feedback, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.

```bash
cp .env.example .env.local
# add your OpenAI key
npm run dev
```

## Project structure

```
app/
  (public) /, /band-7, /how-it-works, /legal
  (app)    /onboarding, /dashboard, /daily,
           /listening, /reading, /writing, /speaking,
           /mistakes, /progress, /settings
  api/     feedback (writing/speaking/classify),
           mission/generate, speech/transcribe
lib/
  types.ts                  — locked type unions
  mistake-taxonomy.ts       — closed 30-code taxonomy
  mission-engine.ts         — daily mission generation + fallback chain
  spaced-repetition.ts      — Again/Almost/Mastered scheduling
  content-loader.ts         — loads content from /content
  audio-fallbacks.ts        — mobile audio + recording fallbacks
  ai-prompts.ts             — locked AI system + user templates
  ai-client.ts              — OpenAI wrapper with mock fallback
  app-state.ts              — localStorage-backed app state
  storage.ts                — SSR-safe localStorage hook
content/
  writing-prompts.ts        — 15 prompts
  speaking-prompts.ts       — 50 prompts (Part 1/2/3)
  vocabulary.ts             — 100 items
  grammar.ts                — 30 drills
  listening/bank.json       — 2 listening sets
  reading/bank.json         — 2 reading passages
components/
  ui/                       — design system (Button, Card, Disclaimer)
  layout/                   — AppShell, PublicNav, PublicFooter
```

## Brand and legal

- Brand: **Band 7 Daily Coach** (not "IELTS Daily Coach" — trademark risk).
- Use "IELTS" descriptively only.
- The footer carries the independent-prep disclaimer.
- No IELTS logos. No official-looking branding. No copied official test content.

## Phase 0 checklist (lock before code)

- [x] One-page north star
- [x] Closed TypeScript unions
- [x] Content schema (ContentItem + UserContentState)
- [x] First-session design (hand-tuned 10-minute mission)
- [x] Daily Mission design doc (in `lib/mission-engine.ts` comments)
- [x] Mistake taxonomy (30 codes, closed)
- [ ] Classifier tested on 20 ambiguous mistakes
- [ ] 20 listening scripts reviewed
- [ ] TTS provider chosen (OpenAI / ElevenLabs / Azure)
- [ ] First tester recruited (2-week commitment, calendar date)

## Roadmap

**V0.1 — Prototype (this build)**
Daily loop, 4 skill trainers, error notebook, mobile-friendly, AI feedback wired (mock by default).

**V1 — Exam-complete, 3–4 weeks of content**
32+ listening exercises, 24+ reading passages, 40+ Task 1 prompts, 60+ Task 2 prompts, 300+ speaking prompts, 500+ vocab, 200+ grammar, 4 mini mocks, 2 full mocks, real TTS audio, real AI feedback.

**V1.5 — 8–12 week program**
Auth (Supabase), cross-device progress, 10–20 beta users, feedback history, content import tool.

**V2 — Public product**
Payments, admin CMS, SEO pages, teacher review, mobile PWA, profession topic packs.

## What V0.1 does not include (yet)

- Real TTS audio. The transcript is shown instead.
- Speech-to-text on the actual recording. Without `OPENAI_API_KEY`, the speaking trainer returns a placeholder transcript.
- Listening/Reading content beyond 2 sets each. The Daily Mission will rotate through them quickly.
- Admin panel. Content is in static files; updates require a redeploy.
- Payments. The product is private.

## Mobile

- 390px width supported
- Tap-to-play audio when needed
- Microphone permission errors handled with a clear "upload audio file" fallback
- Review cards sized for one-thumb use

## License

Internal prototype. Not for distribution.
