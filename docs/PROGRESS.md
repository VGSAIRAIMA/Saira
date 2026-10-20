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

## Milestone 2: The Sheet with Persistence & Firebase Cloud Sync — [COMPLETED]

### Completed Tasks (Local Half)
- [x] Local-first storage integrated using `idb-keyval` (IndexedDB):
  - Stores `ItemProgress`, `CustomItem[]`, `DayLog` map, and `hiddenIds` set.
  - Environment-safe fallback with in-memory store ensuring 100% test reliability.
- [x] Atomic DayLog writes on item tick:
  - Toggling status to `done` atomically sets item completion, timestamps, initial revision due date, and increments today's `DayLog.completed += 1` in a single persistent write.
  - Unticking on the same day decrements `DayLog.completed` without losing notes or confidence ratings.
- [x] 6-second floating undo toast with one-click restore.
- [x] Full interactive Sheet UI per `docs/05-sheet-spec.md`:
  - Desktop sticky left rail with overall progress ring and 6 phase cards with accent left borders and progress bars.
  - Phase header with description, large progress ring, "Continue" button, and count-mode toggle (`all` / `subtopics_only` / `practice_only`).
  - Topic accordions with `[K]`, `[S]`, `[+]` source tags, Striver section badge, note hint line, progress bar, Learn checklist, Practice candidates, and "Mark all learn items done".
  - High-density item rows with checkbox, candidate badges for unverified practice, confidence 5-dots, bookmark star, link badges (video, article, practice), and revision due pill.
  - Detail drawer (right slide-over) with title overlay editing, 4-status selector, 1-5 confidence rating, key idea input, mistakes textarea, markdown notes editor (up to 20k chars), URL links with `https://` validation, study timer with minutes counter, attempts tracker, bookmark star, and item hide/unhide.
  - Global search modal (Ctrl/Cmd-K or `/`) across titles, notes, and key ideas, grouped by phase.
  - Full keyboard navigation: `j`/`k` to move, `x` to toggle done, `Enter` to open drawer, `n` to view notes, `b` to bookmark, `/` or `Ctrl+K` to search, `g t` for Today, `g s` for Sheet, `Escape` to close.
  - Custom items modal allowing user to add subtopics or practice items to any topic.
  - Hidden items modal with one-click unhide.
  - Export and import JSON backup functionality.

### Completed Tasks (Firebase Cloud Sync Half)
- [x] Installed `firebase` SDK (v13.0.0). Configured strictly via Vite environment variables (`VITE_FIREBASE_*`).
- [x] `.env.example` created with all configuration placeholders. `.env` is ignored by `.gitignore` and never committed.
- [x] Implemented `src/lib/firebase.ts` with offline persistence enabled via `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. Safe initialization handles missing credentials gracefully.
- [x] Google Authentication built with Firebase Auth (`useAuthStore.ts`) providing `signInWithGoogle` and `signOutUser`.
- [x] Built bidirectional, non-destructive first-signin merge algorithm in `src/lib/sync.ts`:
  - **Progress**: Newer `updatedAt` / `lastTouchedAt` timestamp wins on collision. Local-only items upload to Firestore; cloud-only items download to IndexedDB.
  - **DayLogs**: Non-destructive union. `completed`, `revised`, and `minutes` are max-merged (`Math.max(local, cloud)`). `restDay` is OR-merged. Effort is never decreased.
  - **Custom items**: Union by `id`.
  - **Hidden items**: Set union.
- [x] Realtime sync: Firestore snapshot listeners automatically propagate changes across devices in real time.
- [x] Security rules (`firestore.rules`):
  - User documents partitioned under `users/{uid}/**` with strict `request.auth.uid == uid` ownership checks.
  - Progress documents enforce valid status (`not_started`, `in_progress`, `done`, `needs_revision`) and payload bounds (notes $\le 20\text{k}$, keyIdea $\le 500$, mistakes $\le 2\text{k}$).
- [x] Security rules unit tests written and verified against Firestore emulator using `@firebase/rules-unit-testing`:
  - Owner read/write verified.
  - Cross-user access denied.
  - Unauthenticated access denied.
  - Invalid status rejected.
  - Oversized payloads rejected.
- [x] Top bar AppShell updated with sync status indicator pill (`Synced` / `Syncing...` / `Offline` / `Local Mode`) and Google avatar popover.
- [x] Dedicated `LoginPage.tsx` with Google sign-in button, loading state, error alerts, and reassurance on offline-first data safety.
- [x] Verified Milestone 2 Acceptance:
  - 64 unit tests passing in Vitest (`pnpm test`).
  - 7 emulator security rules tests passing (`pnpm test:rules`).
  - Zero TypeScript errors (`tsc --noEmit`).
  - Zero ESLint errors or warnings (`eslint .`).
  - Production build succeeds cleanly (`vite build`).

---

## Next Up: Milestone 3 (Today, Streaks, History, Quotes)

### Plan for Next Step
1. Build Today page (greeting, deterministic daily quote, today target ring, continue learning card, revision queue counter, 7-day strip).
2. Build History log page and 52-week heatmap.
3. Build Progress analytics page with phase completion bars, pace, projected finish date, weekly bars, and confidence distribution.


