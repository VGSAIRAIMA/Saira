# Bugfix Plan: App Startup Data Initialization & Skeleton Loading States

This document details the analysis, root cause, architectural fix, loading skeleton design, and validation test for the initial data loading bug.

---

## 1. Problem Statement & Root Cause Analysis

### What Happened
When closing and reopening the app (or launching the installed PWA):
- The app defaults to the `/today` route wrapped in `AppShell`.
- The `/today` dashboard and `/progress` analytics page show zero progress (0 items, 0 day streak, 0% target, empty heatmap).
- When the user clicks the "Sheet" tab, all the stored items, streaks, and day logs suddenly appear. Returning to `/today` or `/progress` then displays the real data.

### Root Cause
1. In `src/features/sheet/SheetPage.tsx` (lines 33–35):
   ```tsx
   useEffect(() => {
     initialize();
   }, [initialize]);
   ```
   The `useSheetStore.initialize()` function was **only** invoked in `SheetPage.tsx`.
2. When the app is launched or refreshed on `/today` or `/progress`, `SheetPage` is never mounted.
3. Therefore, `useSheetStore` remained in its uninitialized initial state:
   - `isLoaded: false`
   - `progress: {}`
   - `dayLogs: {}`
   - `customItems: []`
   - `hiddenIds: new Set()`
4. Neither `TodayPage.tsx` nor `ProgressPage.tsx` checked `isLoaded`. They read `progress` and `dayLogs` directly from the store, calculating stats over empty maps and rendering fake 0s.
5. Only when the learner navigated to `/sheet` did `SheetPage` mount and trigger `initialize()`, which read IndexedDB/Firestore and set `isLoaded: true`.

---

## 2. Proposed Changes

### A. Move Initialization to App Startup (`src/app/AppShell.tsx`)
`AppShell` is the root layout component for all authenticated/main views (`/today`, `/sheet`, `/revision`, `/progress`, `/settings`).
By calling `initialize()` in a `useEffect` inside `AppShell`:
```tsx
const initialize = useSheetStore((s) => s.initialize);
useEffect(() => {
  initialize();
}, [initialize]);
```
The store begins loading IndexedDB and Firestore data immediately on app launch, no matter which route is requested first.
Since `useSheetStore.initialize()` begins with:
```ts
if (get().isLoaded) return;
```
the initialization is idempotent and will not re-run redundantly if called again.

### B. Add Honest Loading Skeletons (`TodayPage.tsx` & `ProgressPage.tsx`)
To prevent flashing "0 items done" or "0 day streak" during the few milliseconds while IndexedDB/storage is reading:
1. `TodayPage.tsx`:
   Check `const isLoaded = useSheetStore((s) => s.isLoaded)`.
   If `!isLoaded`:
   Render sleek animated pulse skeletons for:
   - Greeting header
   - Quote card (2 cols) & Target ring (1 col)
   - Continue learning card
   - 7-day consistency strip
2. `ProgressPage.tsx`:
   Check `const isLoaded = useSheetStore((s) => s.isLoaded)`.
   If `!isLoaded`:
   - Analytics tab: skeletons for 4 stat cards, phase breakdown bars, weekly velocity chart, confidence distribution.
   - History tab: skeletons for 52-week heatmap grid and activity log table.

### C. Unit Test for Fresh Start Initialization (`src/stores/__tests__/fresh-start-load.test.ts`)
Add a dedicated test proving that:
1. Initializing the store directly (as done by `AppShell` on a fresh start) loads data from storage without `SheetPage`.
2. Derived stats (`calculateStreak`, `calculateOverallCompletion`, `calculatePace`) return accurate non-zero numbers immediately upon load.
3. Multiple `initialize()` calls are safe and idempotent.

---

## 3. Files to Modify

1. `src/app/AppShell.tsx` (call `initialize()` on startup)
2. `src/features/today/TodayPage.tsx` (add loading skeleton when `!isLoaded`)
3. `src/features/progress/ProgressPage.tsx` (add loading skeleton when `!isLoaded`)
4. `src/stores/__tests__/fresh-start-load.test.ts` (test suite for fresh startup initialization)
