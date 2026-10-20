# AGENTS.md: SAIRA project context for the build agent

(Copy this file to the repo root as `AGENTS.md`. If Antigravity does not pick it up automatically, paste it into the workspace Rules.)

## Who and what

You are building **SAIRA**, a dark-mode, installable PWA that tracks one learner's journey through Data Structures and Algorithms. The learner is **Raima**, a first-year BE CSE student in Chennai, a beginner at DSA, learning **Java**. She starts studying on 2026-10-15 and wants visible, trustworthy proof of her progress and consistency. She learns by building, so keep the code readable and explain non-obvious decisions in short comments or in `docs/DECISIONS.md`.

## Read in this order

1. `docs/01-PRD.md` (what and why) · 2. `docs/05-sheet-spec.md` (**the core**) · 3. `docs/02-user-requirements.md` · 4. `docs/03-tech-requirements.md` · 5. `docs/06-design-system.md` · 6. `docs/07-pwa-and-notifications.md` · 7. `docs/08-firebase-and-deploy.md` · 8. `docs/09-build-plan.md` (milestones and acceptance).
Seed data: `src/data/sheet.seed.json`, `quotes.seed.json`, `avatar-lines.seed.json`. Brand assets: `brand/`.

## Non-negotiable rules

1. **The sheet comes first.** Do not start reminders, push, quotes polish or the landing page until Milestone 2 (sheet with persistence) passes its acceptance checks.
2. **No dummy data.** Every number in the UI is computed from stored user data. No hard-coded demo progress, no fake streaks, no placeholder charts with invented values.
3. **Do not invent content.** Never fabricate Striver problem names, Kunal video links or timestamps. Seed items with `verified:false` show a `candidate` badge and have no links. The user supplies or confirms links.
4. **Stable IDs.** Never rename or reuse seed ids. Content changes bump `schemaVersion`.
5. **Local-first, no data loss.** Optimistic updates, offline queue, merge on first sign-in by newer `updatedAt`, never delete user data on conflict.
6. **Secrets.** Only the public Firebase web config goes in `VITE_*` env vars. Service account JSON, if used, lives only in a GitHub Actions secret. Never commit `.env`.
7. **Honest limits.** A browser cannot show a character on the desktop outside the browser; background push can be delayed; speech may be blocked until user interaction. Reflect this in the UI copy and README, do not hide it.
8. **Accessibility and reduced motion** are requirements, not extras.
9. **No unrequested scope**: no analytics SDKs, no AI chat, no leaderboards, no payments.
10. **Reminder tone** is warm and never guilt-tripping.

## Domain definitions (use these exact meanings)

- **Item**: a subtopic or practice item in the seed, or a user-created custom item.
- **Done**: `status === 'done'`. Percentages count items equally unless the UI toggle says otherwise; hidden items are excluded.
- **Day / dayKey**: local calendar day in the user's time zone (default `Asia/Kolkata`), `YYYY-MM-DD`.
- **Active day**: ≥ 1 item completed or revised, or ≥ 15 minutes logged, or a rest day (max 1 per ISO week).
- **Streak**: consecutive active days ending today (or yesterday if today isn't over). Rest day preserves but doesn't increment.
- **Source tags**: `K` Kunal, `S` Striver, `+` added.
- **Phases**: 0 Programming and Java foundations, 1 Complexity and math, 2 Core structures and techniques, 3 Linked structures and trees, 4 Graphs and dynamic programming, 5 Advanced and optional.

## Conventions

- TypeScript strict; no `any` without a comment. Pure logic in `src/lib/stats` with Vitest tests. UI components small and typed.
- Tailwind + shadcn/ui; colours only via tokens from `06-design-system.md`; no inline hex except in the brand mark.
- Conventional commits (`feat:`, `fix:`, `docs:`). One milestone per branch/PR if using Git.
- After each milestone: run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, run the acceptance checklist, update `docs/PROGRESS.md` (what's done, what's next, any deviations).
- When something in the docs is ambiguous or conflicts, choose the simplest option that satisfies the user stories, record the decision in `docs/DECISIONS.md`, and continue. Ask the user only for things only she can supply (see below).

## Things only the learner can provide (ask once, early)

- Firebase project config values and VAPID key (guide her through `docs/08-firebase-and-deploy.md`).
- Final coach avatar art (a placeholder is fine for now).
- Confirmation of Striver/Kunal links as she studies each section.
- Whether to use a custom domain.

## Definition of done for the whole app

She ticks items today, closes the browser, opens the app tomorrow on her phone, and sees the same ticks, an incremented streak, a populated history and correct percentages; the coach appears at 8:30 and 19:00 while the app is open, and push works when installed; the app deploys to Firebase Hosting and installs as a PWA.

## reference
Match the look of docs/reference/SAIRA.html. It is a visual reference only. Rebuild in React, Tailwind and shadcn/ui and do not copy its code or sample data.
