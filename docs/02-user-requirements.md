# SAIRA: User Requirements

Format: user stories with acceptance criteria. Priority P0/P1/P2 matches the PRD. "Learner" = the user.

## A. Sheet (most important)

**A1 (P0): Browse the roadmap.** As a learner I see Phase → Topic → Subtopic → Practice, like Striver's sheet, with a progress bar on every phase and topic.
- Sidebar (desktop) / drawer (mobile) lists the six phases with % done and `done/total`.
- Each topic expands to subtopic rows. Phase and topic headers show source tags `K`, `S`, `+`.
- The URL reflects position (`/sheet/p2/p2-arrays`) so refresh and back work.

**A2 (P0): Mark items done.** One click on the checkbox sets status `done` and records `completedAt`.
- Status values: `not_started`, `in_progress`, `done`, `needs_revision`.
- Undo (toast, 6 seconds). Toggling back never deletes notes.
- Counts update everywhere instantly (header, sidebar, Today, Progress) without reload.

**A3 (P0): Per-item detail.** Opening a row shows a side panel: confidence (1–5), key idea, mistakes I made, notes (markdown), video link, article link, practice link, minutes spent, attempts, bookmark, revise-on date.
- Autosave with a visible "saved / syncing / offline" indicator.

**A4 (P0): Honest content labels.** Items not verified show a subtle `candidate` badge; editing a title/link is allowed; verified items show a check.

**A5 (P1): Find things fast.** Ctrl/Cmd-K search across titles, notes and tags; filters by status, source (K/S/+), phase, bookmarked, due for revision, confidence ≤ 2.

**A6 (P1): Make it mine.** Add a custom topic, subtopic or practice item to any phase; reorder custom items; hide items I don't want (hidden items are excluded from percentages, with a visible "N hidden" chip).

**A7 (P1): Export / import.** Download all progress as JSON and CSV; import JSON to restore. This is the backup story.

**A8 (P0): Continue where I left off.** A "Continue" button (sheet header and Today) jumps to the first not-done item in roadmap order, or the last item I touched.

## B. Daily habit loop

**B1 (P0): Today page.** Shows: greeting, today's daily quote, streak, today's target (default 3 items, editable) with a progress ring, "Continue" card, revision queue count, last 7 days strip.

**B2 (P0): Daily quote.** One quote per day, deterministic from the date, interactive: ♥ favourite, "another one" (does not change the day's saved quote), copy, and a category chip. Milestone quotes appear on streak/phase milestones. Source: `data/quotes.seed.json`.

**B3 (P0): Streaks and history.** Current streak, longest streak, active days, a 52-week heatmap, and a day-by-day log (what I completed, minutes). History persists and syncs.

**B4 (P1): Revision.** Done items get a revise-on date using spaced steps (default +1, +3, +7, +21, +60 days). A Revision page lists due items; marking "revised" schedules the next step; rating confidence ≤ 2 shortens the interval.

**B5 (P1): Weekly review ("regular checkup").** Each Sunday (and on demand): this week's completed count, minutes, active days, best day, confidence trend; the learner writes one line on what went well/what was hard and sets next week's target. Saved to history.

**B6 (P1): Progress analytics.** Overall and per-phase completion, remaining count, average items per active day (last 14 days), **projected finish date** at current pace, consistency score = active days in last 30 ÷ 30, weekly bar chart, confidence distribution.

## C. Reminders and the coach

**C1 (P0): In-app coach reminder.** At the configured times (default **8:30** morning and **19:00** study) while the app is open/installed and running, a full-width overlay slides in: coach avatar, a spoken line (browser speech), the line as text, buttons **Start** (go to Today/Continue), **Snooze 15 min**, **Not today**.
- Voice is optional (Settings toggle). If speech is blocked, show a "Play voice" button.
- Never fires if today's goal is already done (shows the `done_today` line only if the user opens the app).

**C2 (P1): Background push.** With permission granted and the PWA installed, a system notification arrives at 8:30 and 19:00 IST even if the app is closed. The notification uses the coach image as icon; clicking opens Today and shows the coach overlay.
- Honest limit shown in Settings: delivery can be delayed by the OS/browser.

**C3 (P0): Reminder settings.** Enable/disable, times (two slots), days of week, voice on/off, snooze length, quiet hours. Test button: "Preview reminder".

## D. Account, sync, install

**D1 (P0): Sign in with Google.** Required for cloud sync. Before sign-in the app can run local-only; first sign-in merges local data into the cloud with no loss.
**D2 (P0): Offline.** The sheet, Today and notes work offline; changes queue and sync when online. Sync state is always visible.
**D3 (P0): Install.** An install button appears when the browser allows it; the installed app opens standalone with the SAIRA icon and splash.
**D4 (P0): Multi-device.** Marking an item done on the phone appears on the laptop within seconds when both are online.
**D5 (P1): Delete my data.** Settings has "Export" and "Delete account data".

## E. Look and feel

**E1 (P0): Dark, premium, readable.** Dark theme only for v1. Clear visual distinction between phases (distinct accent hue per phase), generous spacing, strong type hierarchy, never low-contrast text (WCAG AA).
**E2 (P1): Cinematic landing/login.** Fullscreen looping muted video, glass nav, serif display headline; the rest of the app is a fast, video-free dashboard.
**E3 (P0): Responsive.** Fully usable on a 360 px phone and a 1440 px laptop; touch targets ≥ 44 px.
**E4 (P0): Accessible.** Keyboard navigable, visible focus, reduced-motion respected (video paused, animations minimal), ARIA labels on icon buttons.

## F. Definition of "not dummy"

The learner can: tick items today, close the browser, reopen tomorrow (or on another device), and see the same ticks, the streak incremented, history populated, percentages correct. If any displayed number can't be traced to stored data, the build is wrong.
