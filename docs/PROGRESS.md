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

## Milestone 3: Today, Streaks, History, Quotes — [COMPLETED]

### Completed Tasks
- [x] Deterministic Quotes Engine (`src/lib/quotes.ts`):
  - Deterministic hashing algorithm based on `dayKey` (YYYY-MM-DD in user's timezone) indexing into `src/data/quotes.seed.json`.
  - Guarantees the daily quote is stable for the whole day across reloads and devices.
  - In-session `shift` rotation ("Another quote") without altering the day's stable anchor.
  - Milestone celebration quotes (`cat: "milestone"`).
  - Storage persistence for user's favorite quotes (`KEYS.FAVORITE_QUOTES`) in `src/lib/storage.ts` and `useSheetStore`.
  - Comprehensive unit test suite in `src/lib/__tests__/quotes.test.ts`.
- [x] Dynamic Streak Flame in AppShell:
  - Top bar flame count dynamically wired to `calculateStreak(dayLogs).currentStreak`.
- [x] Today Page (`src/features/today/TodayPage.tsx`):
  - Time-of-day greeting ("Good morning / afternoon / evening") with user's first name.
  - Quote Card (`QuoteCard.tsx`): Instrument Serif display typography (28px), category pill, favorite heart button (♥), "Another quote" rotator, and copy-to-clipboard button with copied check indicator.
  - Target Progress Ring (`TodayTargetRing.tsx`): SVG animated circular progress ring, completion percentage, completed vs target counter, streak badge, minutes spent counter, and inline target editor dialog allowing learners to set custom daily goals (1–20 items).
  - Continue Learning Card (`ContinueCard.tsx`): Resolves next uncompleted, non-hidden curriculum item in sequential order using `getContinueItemId()` with phase accent badge, subtopic/practice problem indicator, and direct "Continue Sheet" CTA.
  - Milestone Celebrations Banner (`MilestoneBanner.tsx`): Triggers celebratory banner with trophy/flame badge and milestone quote upon reaching streak thresholds (3, 7, 14, 30, 50, 100 days) or completing 100% of any phase, with session-safe dismissal.
  - 7-Day Consistency Strip (`WeekStrip.tsx`): Displays the last 7 calendar days leading up to today, evaluating active days via `isActiveDay(dayLog)` and rest days via `isPureRestDay(dayLog)` with active checkmarks and current day highlight.
  - Spaced Revision Queue Banner: Summarizes items due for spaced review today with direct link to `/revision`.
- [x] History & 52-Week Heatmap (`src/features/history/`):
  - 52-Week Matrix (`Heatmap52.tsx`): 7 rows $\times$ 52 columns SVG calendar grid (364 days leading up to today) aligned to calendar day of week.
  - 5 brand-violet intensity levels based on completed items ($\ge 1, \ge 2, \ge 3, \ge 5$) and study minutes ($\ge 15, \ge 30, \ge 60, \ge 90$).
  - Floating hover tooltips displaying formatted date, completed problem count, revised count, study minutes, and rest day status.
  - Chronological Activity Log Table (`ActivityLogTable.tsx`): Tabular history log with date, active/rest status badges, completion count, revision count, study minutes, and pagination.
- [x] Progress & Analytics Page (`src/features/progress/ProgressPage.tsx`):
  - Tabbed interface switching between "Analytics" and "History", with route `/history` redirecting to `/progress?tab=history`.
  - Four Summary Stat Cards (`StatCards.tsx`):
    - Overall Completion: `calculateOverallCompletion(allPhases, progress, hiddenIds)` with progress bar.
    - 14-Day Study Pace: `calculatePace(dayLogs, todayKey, 14)` items / active day.
    - 30-Day Consistency: `calculateConsistency30(dayLogs, todayKey)` percentage and active days count.
    - Projected Finish Date: `calculateProjectedFinish(todayKey, remaining, pace)` with estimated study days.
  - Phase Completion Breakdown (`PhaseBars.tsx`): Sequential progress bars for all 6 phases with designated phase accent tokens (`--ph0` through `--ph5`) and direct links to phase sheets.
  - Weekly Velocity Chart (`WeeklyVelocityChart.tsx`): Recharts `BarChart` displaying weekly volume (completed & revised) over the past 8 weeks.
  - Confidence Distribution (`ConfidenceDistribution.tsx`): Mastered (5), Strong (4), Solid (3), Shaky (2), Struggling (1), and Unrated breakdown with stacked visual distribution bar and percentage cards.
  - Honest Empty States: Zero hard-coded fake numbers; clear, calm prompts when no activity has been logged yet.
- [x] Zero Math Duplication: All metrics strictly derived using pure functions from `src/lib/stats/`.
- [x] Verified Milestone 3 Acceptance:
  - 76 unit and integration tests passing in Vitest (`pnpm test`).
  - Zero TypeScript errors (`pnpm typecheck`).
  - Zero ESLint errors or warnings (`pnpm lint`).
  - Production build succeeds cleanly (`pnpm build`).

---

## Milestone 4: PWA and Offline — [COMPLETED]

### Completed Tasks
- [x] Web App Manifest Configuration:
  - Configured `vite-plugin-pwa` with complete manifest per `docs/07-pwa-and-notifications.md §2`.
  - Configured `name: "SAIRA: DSA Study Tracker"`, `short_name: "SAIRA"`, `theme_color: "#131315"`, `background_color: "#131315"`, `display: "standalone"`, `start_url: "/today"`, `scope: "/"`.
  - Icon suite wired in manifest: `icon-192.png`, `icon-512.png`, and `maskable-512.png` with purpose `"maskable"`.
  - App shortcuts registered for `/today`, `/sheet`, and `/revision`.
  - `index.html` updated with Apple touch meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`, `theme-color`).
- [x] Custom Service Worker (`src/sw.ts` with Workbox `injectManifest`):
  - Precache app shell, HTML, JS, CSS, and bundled seed JSON.
  - Stale-while-revalidate for local images and Google Fonts stylesheets.
  - Cache-first for Google Fonts webfonts with 1-year expiration.
  - Single-page application navigation fallback to `/index.html` with explicit denylist excluding Firebase internal routes (`/__/*`).
  - **Explicit NetworkOnly bypass**: Firestore network calls (`firestore.googleapis.com`, `*.firebaseio.com`), Firebase Auth calls (`identitytoolkit.googleapis.com`, `securetoken.googleapis.com`), and Google OAuth endpoints are never cached by the service worker.
  - `SKIP_WAITING` event listener for smooth user-controlled updates.
- [x] Update Prompt UX (`src/components/pwa/UpdatePrompt.tsx`):
  - Floating toast rendered via `useRegisterSW` (`virtual:pwa-register/react`).
  - Alerts the learner when a new service worker version is waiting with an "Update Now" action and safe "Later" dismissal.
- [x] Install UX (`src/components/pwa/InstallButton.tsx` & `usePWAInstall.ts`):
  - Hook captures `beforeinstallprompt` and tracks `display-mode: standalone`.
  - "Install App" button in sticky top bar and dedicated Install section in Settings.
  - iOS-specific instructional modal guiding iPhone/iPad users through "Share → Add to Home Screen".
  - Automatically hidden once installed in standalone mode.
- [x] Offline Banner UX (`src/components/pwa/OfflineBanner.tsx`):
  - Listens to `online` and `offline` events.
  - Displays a calm amber notice reassuring the user that SAIRA is fully operational offline with local IndexedDB persistence.
- [x] Verified Milestone 4 Acceptance:
  - 79 unit and integration tests passing in Vitest (`pnpm test`).
  - Unit tests in `src/components/pwa/__tests__/pwa.test.ts` verify manifest icon files exist, meta tags are set, and service worker bypass rules are enforced.
  - Zero TypeScript errors (`pnpm typecheck`).
  - Zero ESLint errors or warnings (`pnpm lint`).
  - Production build succeeds with `dist/sw.js` and `dist/manifest.webmanifest` generated.

---

## Next Up: Milestone 5 (Reminders and the Coach)

### Plan for Next Step
1. Settings for times (08:30 and 19:00 default), days of week, voice, snooze, and quiet hours.
2. Reminder scheduler (`src/lib/schedule.ts`) with fake-clock unit tests.
3. Coach overlay component with avatar art (idle, talking, cheer), speech synthesis, and fallbacks.
4. Local system notifications with `Start` and `Snooze` actions.
5. Reminder preview button in Settings.


