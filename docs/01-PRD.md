# SAIRA: Product Requirements Document (PRD)

Version 1.0 · 2026-10-15 · Owner: Raima · Build agent: Antigravity

## 1. What we are building

SAIRA is a **PWA study tracker for Data Structures and Algorithms (DSA)**, modelled on the feel of Striver's A2Z sheet but built around the learner's own six-phase roadmap (Java-first). It records real progress, shows streaks and history, reminds the learner at set times with an animated coach, and syncs across devices through Firebase.

**The sheet is the product.** Everything else (quotes, reminders, analytics) exists to get the learner back to the sheet every day.

## 2. Problem and goals

The learner starts DSA on 2026-10-15 and wants to show performance, consistency and a visible track record. Spreadsheets were rejected: they are passive, can't remind, and don't show streaks. Existing sheets (Striver, Kunal) are not combined and don't track personal confidence, mistakes, notes or revision.

Goals, in priority order:
1. One interactive sheet that merges the Kunal syllabus and Striver A2Z structure into six phases, with real per-item tracking.
2. Daily habit loop: today's plan, quote, reminder, streak.
3. Honest analytics: how much is done, how much is left, pace, projected finish, consistency.
4. Works offline, installable, syncs to the cloud.
5. Looks premium: dark, cinematic landing, fast clean dashboard.

Non-goals (v1): running or judging code in-browser, social features or leaderboards, paid plans, a native app, AI tutoring, multi-language editions (Java only).

## 3. User

Primary: **Raima**, first-year BE CSE student (Chennai), beginner in DSA, learns by building, wants visible proof of consistency for placements and internships. Uses a laptop (Chrome/Edge) and a phone (Android likely).
The app is single-learner in spirit but must be multi-user safe (Firebase Auth, per-user data), so it can be shared with friends later.

## 4. Success metrics

- Daily active use: opens the app on ≥ 6 of 7 days in week 1.
- Streak survives ≥ 14 days.
- Reminder → app open conversion tracked locally (clicked/started vs dismissed/snoozed).
- Technical: Lighthouse PWA installable ✔, Performance ≥ 90 on mobile for the Today page, offline Sheet usable, no data loss on sync conflict.

## 5. Scope

### P0 (must ship, in this order)
1. **Sheet** with six phases, topics, subtopics, practice items, status/confidence/notes/revision (see `05-sheet-spec.md`).
2. **Persistence**: local-first, then Firebase Auth (Google) + Firestore sync.
3. **Today page**: continue-where-you-left-off, today's target, revision queue, daily quote, streak.
4. **Streaks and history**: activity log, heatmap, current/longest streak.
5. **PWA**: installable, offline, app icon (SAIRA mark).
6. **In-app reminders** with animated coach avatar (voice + text, Start/Snooze).
7. **Deploy** to Firebase Hosting.

### P1
8. **Progress/analytics page**: per-phase and per-topic completion, pace, projected finish, consistency score, weekly bars.
9. **Revision system** with spaced intervals.
10. **Background push (FCM)** at 8:30 AM and 7:00 PM IST even when the app is closed.
11. **Weekly review** ("regular checkups"): Sunday summary, rate the week, set next week's goal.
12. Cinematic **landing + login** with fullscreen video and glass nav.
13. Search (⌘/Ctrl-K), filters, bookmarks, custom items, JSON/CSV export and import.

### P2
14. Monthly report card (shareable image), quote favourites, themes beyond dark, custom reminder times per weekday, widgets.

## 6. Key product rules

- **No dummy data in the UI.** Every number shown (completed, remaining, streak, minutes) is computed from the learner's stored data. Empty states are honest ("0 of 262, let's start").
- **Verified vs candidate content.** The seed sheet contains items that are *not verified* against Striver or Kunal. The UI marks them `candidate` and lets the learner edit titles and links. Never display a link or timestamp as official unless `verified: true`.
- **Streak is forgiving but real.** A day counts if ≥ 1 sheet action or ≥ 15 logged minutes (configurable). One "rest day" per week keeps the streak (visible, user-controlled).
- **Time zone is Asia/Kolkata by default** and stored in the profile; a "day" is a local calendar day.
- **Never guilt-trip.** Reminder copy is warm. Missed days get a comeback message, not a penalty.

## 7. Content: the six phases

0. Programming and Java foundations · 1. Complexity and math · 2. Core structures and techniques · 3. Linked structures and trees · 4. Graphs and dynamic programming · 5. Advanced and optional.
Seed totals today: 43 topics, 262 subtopics, 119 practice candidates. Striver reference total: 495 problems across 20 sections (live page counts are in the seed file). Full detail: `05-sheet-spec.md`, `data/sheet.seed.json`.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Striver problem names and Kunal timestamps are unverified | `verified:false` flag, editable links, "paste your link" UX; verification is a content task, not a code blocker |
| Background push at fixed times is not guaranteed | Document limits; in-app reminders always work; push via scheduled job, treated as best-effort |
| Browser speech may be blocked until user interaction | Always show text; "Play voice" button fallback |
| Sync conflicts between phone and laptop | Per-item docs, last-write-wins with `updatedAt`, never delete on conflict |
| Scope creep before the sheet works | Build order in `09-build-plan.md`; sheet milestone must pass acceptance before anything else |
| Video background hurts battery/data | Landing/login only; respect `prefers-reduced-motion` and data saver; poster fallback |

## 9. Open questions (need the learner)

1. Final avatar illustration (agent can generate a placeholder; see `06-design-system.md`).
2. Domain name (default: `<project>.web.app`).
3. Whether to share the app with friends later (affects Firestore rules only slightly).
4. Content verification pass: the learner pastes or confirms Striver/Kunal links section by section.
