# SAIRA: Build Progress

This document tracks progress through the milestones outlined in `docs/09-build-plan.md`.

---

## Milestone 0: Scaffold & App Shell — [COMPLETED]

### Completed Tasks
- [x] Initialized Vite + React 19 + TypeScript directly in the project root without a nested `saira/` folder.
- [x] Preserved existing `docs/`, `brand/`, `seed/`, `AGENTS.md`, `README.md`, and `.gitignore`.
- [x] Moved `seed/*.json` to `src/data/` using `git mv` to preserve git history.
- [x] Copied brand icons from `brand/` to `public/icons/` (icon-192, icon-512, maskable-512, apple-touch-icon, favicon-32, saira-mark.svg).
- [x] Installed and configured core dependencies using `pnpm`:
  - UI & State: `react`, `react-dom`, `react-router-dom`, `zustand`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.
  - Math & Charts: `date-fns`, `date-fns-tz`, `recharts`.
  - Styling: `@tailwindcss/vite`, `tailwindcss` (v4).
  - Tooling: `typescript`, `vitest`, `eslint`, `prettier`.
- [x] Configured CSS variables and design system tokens in `src/index.css` per `docs/06-design-system.md`:
  - Neutral dark theme (`#131315`, `--surface`, `--surface-2`, `--border`, `--primary`, `--accent-pink`).
  - Six distinct phase accent colors (`--ph0` through `--ph5`).
  - Typography: Instrument Serif, Inter, JetBrains Mono.
  - Visual utilities: `.liquid-glass`, `fade-rise` keyframes.
- [x] Built the responsive App Shell (`src/app/AppShell.tsx`):
  - Sticky top bar with SAIRA mark, wordmark, streak flame badge, and avatar.
  - Desktop navigation and mobile bottom navigation bar.
  - Clean placeholder routes for `/`, `/login`, `/today`, `/sheet`, `/sheet/:phaseId`, `/revision`, `/progress`, and `/settings`.
- [x] Verified Milestone 0 Acceptance:
  - `pnpm lint` passed (0 errors, 0 warnings).
  - `pnpm typecheck` passed (0 errors).
  - `pnpm build` passed (production bundle built cleanly).

---

## Milestone 1: Data Layer & Stats (Pure Logic) — [COMPLETED]

### Completed Tasks
- [x] Created strict TypeScript domain models in `src/types/sheet.ts`:
  - `Status`: `'not_started' | 'in_progress' | 'done' | 'needs_revision'`
  - `SourceTag`: `'K' | 'S' | '+'`
  - `Subtopic`, `PracticeItem`, `Topic`, `Phase`, `SheetSeed`, `ItemProgress`, `DayLog`, `Settings`.
- [x] Created typed seed loader and $O(1)$ lookup index in `src/lib/seed.ts`.
- [x] Created comprehensive seed data verification tests in `src/data/__tests__/seed.test.ts`:
  - Exact counts: 6 phases, 43 topics, 262 subtopics, 119 practice items (381 trackable items).
  - All 430 IDs are globally unique, non-empty, and stable.
  - All 119 practice items default to `verified: false` and `link: null` (honest candidates).
  - All source tags belong strictly to `K`, `S`, or `+`.
- [x] Implemented timezone-aware date and dayKey utilities in `src/lib/time.ts`:
  - Default timezone `Asia/Kolkata`.
  - DST-proof calendar day arithmetic (using UTC timestamps).
  - ISO week key extraction (`YYYY-Www`).
- [x] Implemented pure statistics functions in `src/lib/stats/`:
  - `activeDay.ts`: Evaluates active day status ($\ge 1$ item completed/revised, or $\ge 15$ min logged, or rest day).
  - `completion.ts`: Calculates overall, per-phase, and per-topic completion (`done/total`, percentage) with count mode toggles (`all`, `subtopics_only`, `practice_only`), correctly excluding hidden items.
  - `streak.ts`: Computes current streak, longest streak, and total active days. Handles today-in-progress, preserves across rest days without incrementing, and enforces the max 1 rest day per ISO week limit.
  - `pace.ts`: Computes rolling 14-day study pace (items completed per active day) and projected completion date.
  - `consistency.ts`: Computes 30-day consistency score (`activeDays / 30`).
  - `revision.ts`: Implements spaced repetition intervals (`[1, 3, 7, 21, 60]` days) with step regression on confidence $\le 2$.
- [x] Verified Milestone 1 Acceptance:
  - 48 unit tests passing across 8 test suites in Vitest.
  - `pnpm test` green.
  - `pnpm lint` green.
  - `pnpm typecheck` green.
  - `pnpm build` green.

---

## Next Up: Milestone 2 — The Sheet with Real Persistence

### Plan for Milestone 2
1. Local-first storage integration (`idb-keyval` store for progress, custom items, notes, day logs).
2. Interactive Sheet UI per `docs/05-sheet-spec.md`:
   - Left phase rail with interactive progress rings.
   - Topic accordions with `[K]`, `[S]`, `[+]` chips, candidate badges, and progress bars.
   - Rows with checkboxes, confidence dots, bookmark stars, link icons, and notes indicator.
   - Right-side item detail drawer (notes editor, mistakes log, minutes counter, revision date).
   - Search modal (Ctrl/Cmd-K), status and tag filters.
   - Keyboard navigation (`j/k`, `x`, `Enter`, `n`, `b`).
   - Batched writes to `DayLog` on every item completion toggle.
3. Pass all 7 sheet acceptance criteria from `docs/05-sheet-spec.md §9`.
