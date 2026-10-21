# SAIRA: Milestone 3 (Today, Streaks, History, Quotes) Implementation Plan

This document details the architectural plan, component hierarchy, deterministic algorithms, and acceptance criteria for building Milestone 3 of SAIRA.

---

## 1. Objectives & Scope

Milestone 3 brings the learner's daily habit loop to life:
1. **Today Dashboard (`/today`)**:
   - Greeting header with time-of-day awareness and user name.
   - Deterministic Daily Quote card with favorite toggling, "another quote" rotator, and copy to clipboard.
   - Today's Target Circular Progress Ring (e.g., 2/3 items completed today) with editable target.
   - Continue Learning card linking directly to the learner's next pending topic/subtopic.
   - 7-Day Consistency Strip (last 7 calendar days).
   - Spaced Revision counter linking to the revision queue.
   - Milestone celebration banner for streak and phase completions.
2. **History & 52-Week Heatmap (`/progress?tab=history` and `/history`)**:
   - 52-week $\times$ 7-day SVG/CSS interactive study heatmap with 5 brand-violet intensity levels.
   - Interactive hover tooltips showing date, completed count, revision count, and study minutes.
   - Day-by-day historical log table.
3. **Progress & Analytics (`/progress`)**:
   - Summary stat cards: Overall Completion %, 14-day study pace, 30-day consistency score, and projected completion date.
   - Phase progress breakdown across all 6 curriculum phases with designated phase accent tokens.
   - Weekly velocity chart (Recharts) for rolling study volume.
   - Confidence distribution chart (levels 1–5 + unrated).
   - Honest empty states when no activity has been logged yet (no dummy/fake metrics).
4. **AppShell Integration**:
   - Live dynamic streak flame count in the sticky top bar powered by `calculateStreak(dayLogs)`.

---

## 2. Mathematical Rigor & Architecture Guidelines

- **Zero Math Duplication**: All metrics are strictly derived using the pure functions in `src/lib/stats/`:
  - `calculateOverallCompletion`, `calculatePhaseCompletion` from `completion.ts`
  - `calculateStreak` from `streak.ts`
  - `calculatePace`, `calculateProjectedFinish` from `pace.ts`
  - `calculateConsistency30` from `consistency.ts`
  - `isActiveDay`, `isPureRestDay` from `activeDay.ts`
- **Deterministic Daily Quote**:
  - Derived deterministically from the user's `dayKey` (YYYY-MM-DD in user's timezone) hashed into `src/data/quotes.seed.json`.
  - Reloading the page or switching devices produces the exact same quote.
  - "Another quote" button advances an in-session shift without altering the permanent day quote.
- **Honest Empty States**:
  - If pace is 0, projected finish displays an honest prompt: *"Requires active study days to project completion"*.
  - If 0 items are completed, charts display calm, motivating empty state indicators.

---

## 3. Component Hierarchy

```
src/
  lib/
    quotes.ts                           # Deterministic quote selection & milestone quote logic
    __tests__/quotes.test.ts            # Unit tests for quote hashing & stability
  features/
    today/
      TodayPage.tsx                     # Main Today dashboard layout
      components/
        TodayTargetRing.tsx             # SVG Circular progress ring & target editor
        QuoteCard.tsx                   # Instrument Serif quote, categories, favorites & copy
        ContinueCard.tsx                # Next curriculum item resolver
        WeekStrip.tsx                   # 7-day interactive consistency strip
        MilestoneBanner.tsx             # Milestone celebrations (streak / phase / topic)
    history/
      Heatmap52.tsx                     # 52-week SVG activity matrix with tooltips
      ActivityLogTable.tsx              # Chronological list of study days
    progress/
      ProgressPage.tsx                  # Tabbed container (Analytics & History)
      components/
        StatCards.tsx                   # Metric cards (Completion, Pace, Consistency, Finish)
        PhaseBars.tsx                   # Phase completion progress bars (Phases 0-5)
        WeeklyVelocityChart.tsx         # Recharts BarChart for weekly velocity
        ConfidenceDistribution.tsx      # Breakdown across confidence ratings 1-5
```

---

## 4. Implementation Steps

1. **Quote Engine (`src/lib/quotes.ts`)**:
   - Implement `getDailyQuote(dayKey: string, shift?: number): Quote`.
   - Add favorite quote IDs to `useSheetStore` (with persistence to IndexedDB / Firestore `users/{uid}/favorites/{quoteId}`).
   - Add unit tests verifying stability across date keys and shift functionality.
2. **Top Bar Streak Flame (`AppShell.tsx`)**:
   - Connect the header flame badge to dynamic `calculateStreak(dayLogs).currentStreak`.
3. **Build Today Page Components**:
   - Implement `TodayTargetRing` with dynamic SVG circumference calculation.
   - Implement `QuoteCard` with copy-to-clipboard toast and favorite bookmarking.
   - Implement `ContinueCard` using `useSheetStore.getContinueItemId()`.
   - Implement `WeekStrip` rendering the current week's 7 days with active checks.
   - Implement `MilestoneBanner` checking for active streak milestones (7, 14, 30, 50, 100 days) or completed phases.
4. **Build 52-Week Heatmap & History**:
   - Construct a 52-week grid (364 days leading up to today) aligned to calendar day of week.
   - Intensity calculation:
     - 0: 0 items & 0 minutes
     - 1: 1 item or 15–29 min
     - 2: 2 items or 30–59 min
     - 3: 3–4 items or 60–89 min
     - 4: 5+ items or 90+ min
   - Accessible hover tooltips with exact counts.
   - Activity log table listing past study days with pagination/scrolling.
5. **Build Progress & Analytics**:
   - Connect `calculateOverallCompletion`, `calculatePace`, `calculateProjectedFinish`, and `calculateConsistency30`.
   - Build `PhaseBars` for all 6 curriculum phases.
   - Build Recharts `WeeklyVelocityChart` grouping dayLogs by ISO week (`YYYY-Www`).
   - Build `ConfidenceDistribution` aggregating items by confidence level (`1` to `5` and unrated).
6. **Validation**:
   - Run Vitest unit tests (`pnpm test`).
   - Run TypeScript typecheck (`pnpm typecheck`).
   - Run ESLint (`pnpm lint`).
   - Run Vite production build (`pnpm build`).
   - Update `docs/PROGRESS.md`.
