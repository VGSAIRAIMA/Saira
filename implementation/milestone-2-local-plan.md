# SAIRA: Milestone 2 (Local Half) Implementation Plan

## Overview
This phase implements the complete interactive Sheet UI and local-first persistence using `idb-keyval` (IndexedDB) without any Firebase or authentication dependencies yet.

---

## Tooling & Architecture Guide (For Beginners)

- **`idb-keyval`**: A lightweight (under 1 KB), promise-based wrapper around IndexedDB (the browser's built-in local database). It lets us save and load your study progress, notes, and daily logs locally on your machine so nothing is lost when you refresh or close your browser.
- **Zustand Sheet Store**: A centralized React state store that holds the loaded progress, active filters, and current selections in memory for instant, zero-latency UI updates, while asynchronously persisting every change to IndexedDB.
- **Lucide Icons**: Crisp SVG icons for checkmarks, stars (bookmarks), links (video, article, practice), confidence dots, and search.

---

## Detailed Step-by-Step Plan

### 1. Storage & Persistence Layer (`src/lib/storage/`)
- Install `idb-keyval`.
- Define keys:
  - `saira:progress`: `Record<string, ItemProgress>`
  - `saira:custom_items`: `CustomItem[]`
  - `saira:days`: `Record<string, DayLog>`
  - `saira:hidden`: `string[]`
  - `saira:last_touched`: `string` (last touched item ID for "Continue")
- **Atomic updates on item tick**:
  - Toggling status to `done` updates the item's `ItemProgress` and simultaneously updates today's `DayLog` (`completed += 1`), saving both to IndexedDB.
  - Toggling from `done` to `not_started` on the same day decrements `DayLog.completed` without deleting user notes.
- Provide export to JSON and import from JSON backup utilities.

### 2. State Management (`src/stores/useSheetStore.ts`)
- Zustand store managing:
  - `progress`: `Record<string, ItemProgress>`
  - `customItems`: `CustomItem[]`
  - `hiddenIds`: `Set<string>`
  - `dayLogs`: `Record<string, DayLog>`
  - `selectedPhaseId`: current active phase (`p0` to `p5`)
  - `selectedItemId`: item currently open in the detail drawer
  - `countMode`: `'all' | 'subtopics_only' | 'practice_only'`
  - `filters`: status, source tag (`K`, `S`, `+`), bookmarked, due revision, low confidence ($\le 2$), has notes
  - `searchQuery`: string for filtering titles, notes, and key ideas
  - `undoToast`: `{ itemId: string, previousStatus: Status, timeoutId: number } | null`
  - Actions: `toggleItemDone`, `updateItemProgress`, `addCustomItem`, `toggleHideItem`, `setFilter`, `exportBackup`, `importBackup`, `undoLastTick`.

### 3. Full Sheet UI Components (`src/features/sheet/components/`)
- **PhaseRail**: Sticky left rail with overall progress ring and 6 phase cards with progress bars and phase accent left borders.
- **PhaseHeader**: Phase title, description, percentage ring, "Continue" button, and count mode selector.
- **TopicAccordion**: Collapsible topic sections displaying source tags `[K]`, `[S]`, `[+]`, note hints, topic completion, Learn group, Practice group, and topic footer.
- **ItemRow**: High-density interactive row with checkbox, title, candidate badge (for unverified practice), confidence dots, bookmark star, link badges, and revision pill.
- **ItemDetailDrawer**: Side drawer for full item metadata (notes markdown editor with debounce, mistakes log, key idea, video/article/practice links with `https://` validation, minutes timer, attempts, bookmark, hide).
- **UndoToast**: 6-second bottom toast with one-click undo.
- **SearchModal**: Global Ctrl/Cmd-K dialog grouping results by phase.
- **CustomItemModal**: Modal to add custom subtopics or practice problems.
- **HiddenItemsModal**: Dialog listing hidden items with one-click unhide.

### 4. Keyboard Navigation
- `j` / `k`: Navigate focus between items.
- `x`: Toggle done on focused item.
- `Enter`: Open detail drawer.
- `n`: Focus notes in detail drawer.
- `b`: Toggle bookmark.
- `/` or `Ctrl/Cmd-K`: Open search modal.
- `g t`: Go to Today.
- `g s`: Go to Sheet.
- `Escape`: Close drawer / modal.

### 5. Acceptance Validation
- Unit tests validating manual percentage counts against seed data.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Update `docs/PROGRESS.md`.
