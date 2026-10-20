# SAIRA: Milestone 0, 1 & 2 Implementation Plan

This document details the architecture and step-by-step implementation for Milestones 0, 1, and 2 of SAIRA.

---

## Tooling & Architecture Guide (For Beginners)

- **Vite**: A lightning-fast development server and asset bundler that updates code in the browser instantly without full page reloads.
- **React (v18/19) & TypeScript**: React allows writing modular user interface components. TypeScript adds strict types to catch typos and bugs during development.
- **Tailwind CSS**: A utility-first CSS framework providing concise styling classes directly in component code.
- **shadcn/ui (Radix UI)**: Unstyled, accessible UI component primitives that can be styled to match the dark theme and phase colors.
- **Zustand**: A minimalistic and fast state store for React to manage active filters, current item selection, and user progress.
- **react-router**: Provides client-side routing between pages (`/today`, `/sheet`, `/progress`, etc.) with browser history integration.
- **date-fns & date-fns-tz**: Accurate date calculation and timezone handling for `Asia/Kolkata` day keys and streak tracking.
- **Recharts**: React charting library for visualizing consistency, study pace, and completion percentages.
- **Vitest**: Modern testing framework designed to run tests quickly and verify pure calculation functions.
- **ESLint & Prettier**: Automated linting and formatting tools ensuring clean, standardized code.

---

## Milestone 0: Scaffolding & App Shell

### Objectives
- Scaffold Vite (React + TypeScript) directly in the project root without overwriting existing files (`docs/`, `brand/`, `seed/`, `AGENTS.md`, `README.md`, `.gitignore`).
- Move `seed/*.json` to `src/data/` using `git mv`.
- Copy brand icons from `brand/` to `public/icons/`.
- Configure Tailwind CSS with the design system tokens from `docs/06-design-system.md` (dark theme `#131315`, six phase accent colors, fonts, liquid-glass).
- Setup App Shell with responsive navigation (top bar, desktop sticky left rail, mobile bottom navigation bar) and placeholder routes:
  - `/` (Landing placeholder)
  - `/login` (Login placeholder)
  - `/today` (Today dashboard placeholder)
  - `/sheet` (Sheet placeholder)
  - `/sheet/:phaseId` & `/sheet/:phaseId/:topicId` (Sheet deep link placeholders)
  - `/revision` (Revision queue placeholder)
  - `/progress` (Analytics placeholder)
  - `/settings` (Settings placeholder)
- Verify `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass with zero errors.

---

## Milestone 1: Data Layer & Pure Stats Logic

### Objectives
- Create strictly-typed interfaces in `src/types/sheet.ts` for phases, topics, subtopics, practice items, progress entries, and day logs.
- Build a typed seed loader in `src/lib/seed.ts` providing precomputed lookup indices for fast retrieval.
- Add seed verification tests in `src/data/__tests__/seed.test.ts` to confirm exact counts:
  - 6 phases
  - 43 topics
  - 262 subtopics
  - 119 practice items (candidates)
  - 430 total unique IDs
- Implement pure statistics functions under `src/lib/stats/`:
  - `time.ts`: Timezone-aware dayKey calculation (`YYYY-MM-DD` in `Asia/Kolkata`), ISO week extraction, calendar date math.
  - `completion.ts`: Calculations for overall, per-phase, and per-topic progress (`done/total`, percentage) with toggles for all, subtopics-only, or practice-only, excluding hidden items.
  - `activeDay.ts`: Determines if a calendar day counts as active (completed/revised $\ge 1$, or logged study minutes $\ge 15$, or marked as rest day).
  - `streak.ts`: Current and longest streaks calculation. Handles rest days (preserves streak without incrementing, capped at 1 per ISO week), midnight rollovers, today-in-progress, and broken streaks.
  - `pace.ts`: 14-day study pace (items per active day) and projected finish date.
  - `consistency.ts`: 30-day consistency score (`activeDays / 30`).
  - `revision.ts`: Spaced repetition intervals (`[1, 3, 7, 21, 60]` days), stepping back if confidence $\le 2$.
- Add comprehensive Vitest unit tests in `src/lib/stats/__tests__/` covering all edge cases from `docs/03-tech-requirements.md §5`.
- Validate Milestone 1 acceptance criteria and update `docs/PROGRESS.md`.

---

## Milestone 2: The Sheet with Persistence (Upcoming)

### Objectives
- Implement local-first storage using `idb-keyval` to record item ticks, notes, confidence ratings, and day logs offline.
- Build the full interactive Sheet UI per `docs/05-sheet-spec.md`:
  - Sticky phase rail with progress rings.
  - Topic accordions with source chips (`[K]`, `[S]`, `[+]`), candidate tags, and progress bars.
  - Interactive rows with optimistic checkmarks, confidence dots, star bookmarks, and note indicators.
  - Item detail drawer for notes (markdown), links, time spent, and mistakes log.
  - Search (Ctrl/Cmd-K), filters, keyboard navigation (`j/k`, `x`, `Enter`, `n`, `b`), and custom item creation.
  - Batched writes to update `DayLog` on every tick.
  - Prepare data synchronization contracts for Firebase Auth + Firestore merge on sign-in.
- Pass the 7 sheet acceptance criteria from `docs/05-sheet-spec.md §9`.
