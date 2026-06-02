# Training Material Audit — Band 7 Daily Coach

Last updated: 2026-06-02

## Bottom line

The current repository is good enough for a first UX/prototype learner to start testing the daily habit loop, Writing feedback flow, Speaking recording flow, Error Notebook, onboarding, and progress screens.

It is **not yet enough for a student to rely on as their main IELTS Academic Band 7 / C1 preparation program**.

The gap is not the page structure. The gap is content depth and exam realism.

## Current material in the repository

Based on the current README and content structure:

| Area | Current amount | Status | Can a student start? | Enough for Band 7 prep? |
|---|---:|---|---|---|
| Writing prompts | 15 prompts / drills | Prototype usable | Yes | No |
| Speaking prompts | 50 prompts | Prototype usable | Yes | No |
| Vocabulary | 100 items | Warm-up usable | Yes | No |
| Grammar drills | 30 drills | Warm-up usable | Yes | No |
| Listening | 4 sets | Starter scripts ready for static MiniMax TTS audio generation | Yes, after MP3 generation | No |
| Reading | 2 passages | Stub/basic practice | Yes, lightly | No |
| Mini mocks | Not enough yet | Missing/insufficient | No | No |
| Full mocks | Not present | Missing | No | No |
| Real TTS audio | Offline MiniMax generation script added | Requires local key and generated MP3 commit | Soon | No |
| Real STT | Code path added; requires API key | Not usable until key is set | Soon | Depends on testing |

## Official exam coverage requirement

A serious Band 7/C1 prep program must train all four IELTS Academic sections:

- Listening
- Reading
- Writing
- Speaking

It also needs timed practice, review, feedback, mistake memory, and repeated exposure to all major IELTS question types.

## V0.1 readiness

V0.1 can be used for:

1. Testing whether the daily mission habit feels good.
2. Testing whether the student understands the UI.
3. Testing Writing feedback UX.
4. Testing Speaking recording/transcript/feedback UX after API key is added.
5. Testing whether mistakes saved into the Error Notebook actually create useful review behavior.
6. Testing mobile usability.
7. Testing first-pass Listening once static MP3 files have been generated.

V0.1 should not be marketed as complete IELTS preparation.

Recommended language:

> Prototype: use this to build a daily IELTS habit and test feedback workflows. Full exam coverage is still being built.

## What is missing before a student can seriously prepare mostly inside this app

### 1. Listening audio depth

Listening cannot remain thin. The first four original scripts are in place for static MiniMax TTS generation, but V1 still needs breadth across all parts and question types.

Minimum V1 target:

- 32 listening exercises total
- At least 8 for each IELTS Listening part
- Real TTS or human audio
- Transcript hidden until after answering
- Answer explanations
- Distractor explanations
- Mistake saving into Error Notebook

Better V1 target:

- 48 listening exercises total
- 12 for each part

### 2. Reading depth

Two passages are only a UI test.

Minimum V1 target:

- 24 reading passages
- 8 full reading sets
- Coverage of major question types:
  - True / False / Not Given
  - Yes / No / Not Given
  - Matching headings
  - Matching information
  - Matching features
  - Sentence completion
  - Summary completion
  - Multiple choice
  - Short answer
  - Diagram/table completion
- Evidence-based explanations
- Mistake saving into Error Notebook

Better V1 target:

- 36 reading passages
- 12 full reading sets

### 3. Writing Task 1 is underbuilt

Writing Task 2 is the current strength. Task 1 needs a real bank.

Minimum V1 target:

- 40 Task 1 prompts
- 60 Task 2 prompts
- Task 1 types:
  - line graph
  - bar chart
  - pie chart
  - table
  - map
  - process diagram
  - mixed chart
- Task 2 types:
  - opinion
  - discussion
  - advantages/disadvantages
  - problem/solution
  - double question

### 4. Speaking needs more prompts and real transcription

Speaking is promising, but real STT must be tested after the API key is added.

Minimum V1 target:

- 120 Part 1 questions
- 60 Part 2 cue cards
- 120 Part 3 questions
- Real transcription
- Editable transcript
- Regenerate feedback from edited transcript
- Mistake saving for both recording and upload paths

Better V1 target:

- 200 Part 1 questions
- 100 Part 2 cue cards
- 200 Part 3 questions

### 5. Vocabulary and grammar are too thin

The current 100 vocabulary items and 30 grammar drills are enough for a prototype, not a preparation program.

Minimum V1 target:

- 500 vocabulary/collocation items
- 200 grammar drills

Better V1 target:

- 1,000 vocabulary/collocation items
- 400 grammar drills

The content should be connected to Writing/Speaking output, not just passive memorisation.

### 6. Mock practice is missing

A serious IELTS program needs mocks.

Minimum V1 target:

- 4 mini mocks
- 2 full mocks

Better V1 target:

- 8 mini mocks
- 4 full mocks

Mocks must be timed and reviewed. Full mocks are content-heavy and should not be faked.

## Can a student start learning right now?

Yes, but only with the right expectation.

A student can start using the current build for:

- daily habit formation
- Writing Task 2 practice
- Speaking prompt practice after API key is configured
- active mistake review
- light Reading practice
- starter Listening practice after static MP3 files have been generated

A student cannot yet use it as the only resource to pass IELTS at Band 7/C1 because:

- Listening has only 4 starter scripts and requires generated static audio files
- Reading has only 2 passages
- no full mocks are ready
- content volume is too low
- Reading/Listening coverage is still shallow
- real STT needs API key and testing

## Recommended next content sprint

Do not jump straight to 100s of items. Build one excellent seven-day learning loop.

### Seven-day starter pack

Create:

- 4 listening audio exercises
- 4 reading passages
- 7 Writing Task 2 prompts
- 3 Writing Task 1 prompts
- 21 Speaking Part 1 questions
- 7 Speaking Part 2 cue cards
- 21 Speaking Part 3 questions
- 70 vocabulary/collocation items
- 20 grammar drills
- 1 mini mock

Success condition:

A student can study for seven consecutive days without seeing duplicate material and without needing another planner.

## Priority order

1. Generate and commit static audio for the 4 starter listening exercises.
2. Add 7-day starter pack.
3. Add more Reading/Listening depth.
4. Add timers/autosave for Writing and Reading.
5. Test real STT after API key is added.
6. Add one mini mock.
7. Expand toward V1 content targets.

## Final status label

Current repository status should be described as:

> V0.1 prototype: learning loop testable, content incomplete.

Not:

> Complete IELTS Band 7 preparation program.
