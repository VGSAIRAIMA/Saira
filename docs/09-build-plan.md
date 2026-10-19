# SAIRA: Build Plan, Milestones and Acceptance

Work in this order. Do not start a milestone until the previous one passes its acceptance list. After each milestone, update `docs/PROGRESS.md`.

## Milestone 0: Scaffold (≈ 1 session)
- `pnpm create vite saira --template react-ts`, add Tailwind, init shadcn/ui, ESLint, Prettier, Vitest, `react-router`, Zustand, date-fns, Recharts, `vite-plugin-pwa`, `firebase`.
- Copy docs to `docs/`, seed JSON to `src/data/`, brand icons to `public/icons/`, create `AGENTS.md`.
- App shell with routes (placeholders allowed *only* at this stage), design tokens, fonts, dark theme.
- **Accept:** `pnpm dev` runs; `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` pass; tokens match the design doc.

## Milestone 1: Data layer and stats (pure logic)
- Typed seed loader; ID index; seed validation test (counts 6 / 43 / 262 / 119; ids unique).
- `src/lib/stats`: completion, activeDay, streak, pace/projection, consistency30, nextRevisionStep, dayKey helpers (tz-aware).
- **Accept:** Vitest covers the edge cases listed in `03-tech-requirements.md §5`, all green.

## Milestone 2: The Sheet with real persistence (the heart)
- Local-first store (idb-keyval) first, then Firebase Auth + Firestore sync with merge-on-first-sign-in.
- Full sheet UI per `05-sheet-spec.md`: rail, accordions, rows, detail drawer, filters, search, keyboard shortcuts, custom items, hide, bookmarks, notes, export/import, Continue.
- DayLog batched writes on every tick.
- **Accept:** the 7 sheet acceptance checks in `05-sheet-spec.md §9`, plus Firestore rules tests pass.

## Milestone 3: Today, streaks, history, quotes
- Today page, streak flame, week strip, daily target ring, quote card (favourite, another, copy), milestone celebrations.
- History log page and 52-week heatmap; Progress page (phase bars, pace, projected finish, weekly bars, confidence distribution).
- **Accept:** ticking an item changes the Today ring, streak, heatmap and Progress within the same session; reload and second device show identical numbers; quote is stable for the day.

## Milestone 4: PWA and offline
- Manifest, icons incl. maskable, service worker (precache, runtime caching, update prompt), install button, offline banner.
- **Accept:** Lighthouse installable ✔; app opens and works offline; install on phone works.

## Milestone 5: Reminders and the coach
- Settings for times/days/voice/snooze/quiet hours; scheduler with fake-clock tests; coach overlay with speech and fallbacks; local notifications with actions; preview button.
- **Accept:** preview fires overlay + voice + notification; 08:30 and 19:00 fire while open (verified with a fake clock and a manual test); snooze, "not today" and "goal already met" behave; no duplicate firing across two tabs.

## Milestone 6: Revision and weekly review
- Spaced revision queue and page; weekly review dialog on Sundays and on demand; saved to `weeks/`.
- **Accept:** done items appear due at the right dates (unit-tested); a weekly review saves and appears in history.

## Milestone 7: Landing and login (cinematic)
- Video hero per `06-design-system.md §4`, liquid-glass nav and CTAs, Google sign-in, reduced-motion/data-saver fallbacks.
- **Accept:** visuals match the spec; sign-in redirects to `/today`; mobile performance still ≥ 90 on `/today` (landing is excluded from this budget).

## Milestone 8: Background push (FCM)
- Token registration, device docs, SW handler, sender (Option A GitHub Actions cron or Option B Cloud Functions), invalid-token cleanup.
- **Accept:** with the app closed and installed, a notification arrives at the next slot on Android Chrome; clicking opens `/today` with the coach overlay.

## Milestone 9: Deploy and harden
- `firebase.json`, rules deployed, CSP, Lighthouse run, README with learner-friendly steps (first-time Firebase setup, deploy, install, enable notifications, export backup).
- **Accept:** live on `https://<project>.web.app`; Lighthouse PWA ✔; fresh account works end to end; `docs/PROGRESS.md` final.

## Cross-cutting acceptance (every milestone)
- No console errors; keyboard-only path works; 360 px and 1440 px layouts fine; reduced motion honoured; no hard-coded numbers; no secrets in git.

---

## Kickoff prompt (paste into Antigravity)

> You are building SAIRA, a dark-mode installable PWA that tracks a student's DSA learning (Java) with a six-phase sheet, streaks, daily quotes, an animated coach reminder and Firebase sync. Read `docs/04-context-for-agent.md` first and follow it as your rules, then read the other docs in the order it lists. The **sheet** is the most important feature: build milestones in order from `docs/09-build-plan.md`, starting with Milestone 0 and 1, and do not begin reminders or the landing page until the sheet milestone passes its acceptance checks. Use React + Vite + TypeScript + Tailwind + shadcn/ui, Firebase (Auth, Firestore with offline persistence, Cloud Messaging, Hosting) and vite-plugin-pwa. Use the seed data in `src/data/`. Never invent Striver or Kunal links. Create an implementation plan first and show it to me, then work milestone by milestone, running lint, typecheck, tests and the acceptance checklist after each one and updating `docs/PROGRESS.md`. Ask me only for things only I can provide (Firebase config, VAPID key, avatar art).

Suggested follow-up prompts per milestone: "Proceed to Milestone N. Show the plan, implement, run the acceptance checklist, and report failures honestly."
