# SAIRA: Technical Requirements

## 1. Stack (decided)

| Concern | Choice | Notes |
|---|---|---|
| Build | **Vite** + **React 18/19** + **TypeScript (strict)** | SPA, no SSR needed |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix) | Use the current shadcn CLI. If it scaffolds Tailwind v4, keep it; v3 is also fine. Tokens must match `06-design-system.md` |
| Routing | `react-router` | Routes below |
| State | **Zustand** (UI/session) + Firestore as the source of truth for user data | Keep derived stats in pure functions (`/src/lib/stats`) |
| Backend | **Firebase**: Auth (Google), Firestore (offline persistence), Cloud Messaging, Hosting | Free Spark plan covers v1 |
| PWA | **vite-plugin-pwa** (Workbox, `injectManifest` strategy) | Custom service worker so FCM background handler lives in the same SW |
| Charts | **Recharts** | Heatmap drawn with plain SVG/CSS grid |
| Dates | **date-fns** (+ `date-fns-tz`) | Day key = `YYYY-MM-DD` in the user's time zone (default `Asia/Kolkata`) |
| Markdown notes | `react-markdown` + `remark-gfm` | Sanitised, no raw HTML |
| Icons/fonts | `lucide-react`; Google Fonts: Instrument Serif, Inter (400/500/600), JetBrains Mono | Self-host via `@fontsource` for offline |
| Tests | **Vitest** (unit), **Playwright** (a few e2e), Lighthouse CI optional | See acceptance in `09-build-plan.md` |
| Lint/format | ESLint + Prettier, `tsc --noEmit` in CI | |
| Package manager | pnpm (npm acceptable) | |
| Node | 20 LTS or newer | |

## 2. Repository layout

```
saira/
  AGENTS.md                  # agent context (copy of 04-context-for-agent.md)
  docs/                      # these documents
  public/
    icons/ (icon-192.png icon-512.png apple-touch-icon.png favicon-32.png maskable-512.png)
    coach/ (coach-idle.webp coach-talk.webp)   # placeholders until the real art exists
    og.png
  src/
    app/ (routes, layout, providers)
    features/
      sheet/ today/ progress/ revision/ reminders/ quotes/ settings/ landing/ auth/
    lib/
      firebase.ts            # init, persistentLocalCache
      stats/                 # streaks, completion, pace, projection (pure, tested)
      time.ts                # dayKey helpers (tz-aware)
      schedule.ts            # reminder scheduling logic
    data/
      sheet.seed.json  quotes.seed.json  avatar-lines.seed.json
    sw.ts                    # service worker (workbox + FCM)
    components/ui/           # shadcn
  firebase.json  firestore.rules  firestore.indexes.json  .firebaserc
  .github/workflows/ (ci.yml, push-reminders.yml)
  .env.example
```

## 3. Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Landing (video hero) | public |
| `/login` | Login (video hero variant) | public |
| `/today` | Today dashboard | required (local-only mode allowed, see §6) |
| `/sheet`, `/sheet/:phaseId`, `/sheet/:phaseId/:topicId` | Sheet | required |
| `/revision` | Revision queue | required |
| `/progress` | Analytics and history | required |
| `/settings` | Settings (reminders, data, account) | required |

## 4. Data model (client types)

Static seed (bundled JSON, versioned by `schemaVersion`): `Phase → Topic → Subtopic | PracticeItem`. IDs are **stable and never reused** (see seed). User data is stored separately and merged by id.

```ts
type Status = 'not_started' | 'in_progress' | 'done' | 'needs_revision';
type Src = 'K' | 'S' | '+';

interface ItemProgress {          // Firestore: users/{uid}/progress/{itemId}
  status: Status;
  confidence?: 1|2|3|4|5;
  keyIdea?: string; mistakes?: string; notes?: string;     // markdown, ≤ 20k chars
  links?: { video?: string; article?: string; practice?: string };
  minutes?: number; attempts?: number; bookmarked?: boolean; hidden?: boolean;
  completedAt?: Timestamp; lastTouchedAt: Timestamp;
  revision?: { step: number; dueDayKey: string; lastRevisedAt?: Timestamp };
  updatedAt: Timestamp;           // for last-write-wins
}
interface CustomItem { id: string; kind: 'topic'|'subtopic'|'practice'; parentId: string; title: string; order: number; }
interface DayLog { dayKey: string; completed: number; revised: number; minutes: number; restDay?: boolean; }  // users/{uid}/days/{dayKey}
interface Settings { tz: string; dailyTarget: number; reminders: {...}; voice: boolean; ... }               // users/{uid}/meta/settings
```
Full Firestore layout and rules: `08-firebase-and-deploy.md`.

## 5. Stats (pure functions, unit-tested)

- `completion(progress, seed, hidden)` overall/phase/topic.
- `activeDay(dayLog, settings)`: true if `completed+revised ≥ 1` or `minutes ≥ 15` or `restDay`.
- `streak(days, today, tz)`: current and longest. A day with `restDay` keeps the streak but does not increase it; max 1 rest day per ISO week.
- `pace(days, window=14)`: items per active day; `projectedFinish = today + remaining / pace` (null if pace = 0).
- `consistency30 = activeDays(last30) / 30`.
- `nextRevisionStep(step, confidence)`: intervals `[1,3,7,21,60]`; confidence ≤ 2 → step = max(0, step−1).
Test edge cases: midnight rollover in `Asia/Kolkata`, DST-free but verify with `America/New_York` as a sanity zone, device-clock changes, missing days, rest-day cap.

## 6. Auth and local-first

- Firebase Auth with Google provider only.
- On first launch before sign-in, allow **local-only mode** (IndexedDB via Firestore persistence is not available unauthenticated, so use a small local store, e.g. `idb-keyval`) and on first sign-in **merge** into Firestore: for each item, keep the record with the newer `updatedAt`.
- After sign-in Firestore uses `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`, so offline writes queue and sync automatically.

## 7. Performance and quality budgets

- Initial JS ≤ 250 kB gzip for `/today` (lazy-load charts, markdown, landing video).
- Sheet with ~400 rows renders instantly: virtualise only if needed (`@tanstack/react-virtual`), otherwise collapse topics by default.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, PWA installable.
- No layout shift on stat updates; optimistic UI for ticks.

## 8. Security and privacy

- Firestore rules: only the signed-in owner can read/write `users/{uid}/**`; field validation (types, sizes). See `08-firebase.md`.
- Firebase web config is public by design; **service account keys are secrets** (GitHub Actions secret only, never committed).
- Sanitise rendered markdown; no `dangerouslySetInnerHTML` with user content.
- Strict CSP in `firebase.json` headers (allow Firebase, Google Fonts if not self-hosted, and the landing video host).
- Collect only: Google profile name/email/photo for display and auth. No analytics SDK in v1.

## 9. Environment variables (`.env.example`)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=        # Web Push certificate key pair (Firebase console → Cloud Messaging)
VITE_LANDING_VIDEO_URL=https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4
```

## 10. Browser/OS support

Chrome and Edge (desktop, Android) are primary. Safari/iOS: installable and push-capable only when added to the Home Screen on iOS 16.4+; the app must degrade gracefully (in-app reminders still work while open). Firefox: works as a normal site; no install prompt.

## 11. Out of scope (explicit)

In-browser code execution, AI chat, leaderboards, payments, native wrappers.
