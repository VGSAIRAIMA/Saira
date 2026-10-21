# SAIRA — DSA Study Tracker

> **A dark-mode installable PWA that tracks your Striver's DSA Sheet progress with streaks, a coach, and (soon) background push reminders.**

![SAIRA Screenshot — placeholder, replace with a real screenshot](docs/reference/screenshot-placeholder.png)

---

## What is SAIRA?

SAIRA (Study AI Reminder App) is a personal, offline-first Progressive Web App built to help a Java learner work through the 450-item DSA sheet. It combines:

| Feature | What it does |
|---|---|
| **Six-phase sheet** | Tick subtopics and practice items; see per-phase and overall progress |
| **Day logs & streaks** | Tracks active days; streak flame; 52-week heatmap |
| **Spaced revision** | Items due today surface on the Revision page |
| **Daily coach** | Animated coach overlay with themed lines and speech |
| **Background push** *(best effort)* | FCM tokens registered; push sender is a separate repo |
| **Weekly review** | Sunday prompt to reflect on the week |
| **Export / Import** | JSON backup and CSV spreadsheet of all progress |
| **Works offline** | Firestore offline persistence + service worker precache |

---

## Features

- Dark mode only (by design)
- Installable PWA — works on Android Chrome, Edge, and Safari 16.4+ (iOS Home Screen)
- Google sign-in; local-only mode before sign-in
- Firestore sync — same progress on multiple devices within seconds
- Settings: reminder times, days of week, snooze, quiet hours, coach theme, daily target
- "Delete my data" — wipes your Firestore documents, FCM tokens, and Auth account

---

## First-time Firebase Setup

You only do this once.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (e.g. `saira-dsa`). Google Analytics is not needed.

2. **Enable Google sign-in:**
   - Build → Authentication → Sign-in method → Google → Enable
   - Add `localhost` and later your live domain under *Settings → Authorized domains*

3. **Create Firestore:**
   - Build → Firestore Database → Create database → Start in **production mode** → pick a region near you (e.g. `asia-south1`)

4. **Get your web app config:**
   - Project settings → Your apps → **Add app** → Web (</>) → Register app
   - Copy the `firebaseConfig` object

5. **Get your VAPID key (for push notifications):**
   - Project settings → Cloud Messaging → **Web Push certificates** → Generate key pair
   - Copy the key

6. **Create your `.env` file** in the project root (this file is git-ignored):
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_VAPID_KEY=BK...
   VITE_LANDING_VIDEO_URL=https://your-cdn.com/hero.mp4
   ```
   Never commit this file. Never share it.

7. **Install the Firebase CLI:**
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add    # pick your project
   ```

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start the dev server (hot reload)
pnpm dev
# → http://localhost:5173
```

The Firestore emulator is optional but recommended for rules testing:
```bash
firebase emulators:start --only firestore
# Then run:
pnpm test:rules
```

---

## Deploying

> These commands deploy to Firebase Hosting. You must be logged in (`firebase login`).

```bash
# 1. Build the production bundle
pnpm build

# 2. Deploy hosting + Firestore rules + indexes
firebase deploy --only hosting,firestore:rules,firestore:indexes

# Or deploy just hosting (e.g. after a CSS tweak)
firebase deploy --only hosting
```

The CLI prints your live URL: `https://<project>.web.app`

After the first deploy, add your live domain to Firebase → Authentication → Authorized domains if you haven't already (it's usually added automatically for `*.web.app`).

---

## Installing the App (PWA)

**Android Chrome / Edge:**
1. Open the live URL.
2. Tap the three-dot menu → *Install app* (or tap the banner that appears automatically).
3. The app appears on your home screen with the SAIRA icon.

**iOS Safari (16.4+):**
1. Open the live URL in Safari.
2. Tap the Share button → *Add to Home Screen*.
3. Tap Add. The app now works offline from your home screen.

**Desktop Chrome / Edge:**
1. Look for the install icon in the address bar (a small monitor with a +).
2. Click it → Install.

---

## Enabling Notifications

1. Open the app → Settings → **Enable** under "System Notifications".
2. Grant permission in the browser prompt.
3. The device is now registered for background push reminders.

> **Note:** Full background push (when the app is completely closed) requires the push-sender service to be running. See [Honest Limits](#honest-limits) below.

---

## Exporting a Backup

Sheet page → top-right menu → **Data Backup** → choose:

- **Export JSON** — full backup including all progress, notes, and day logs. Import this to restore or transfer to another device.
- **Export CSV** — flat table of item-level progress, useful for spreadsheets or analysis.

To restore: Import JSON → pick the backup file → all data is restored and synced to Firestore.

---

## How the Push-Sender Works

Background push is split across two repos:

| Repo | What it does |
|---|---|
| **saira** (this repo) | FCM token registration, service worker handler, reminder settings in Firestore |
| **saira-push-sender** | GitHub Actions cron that reads settings from Firestore and sends FCM messages |

The sender reads `users/{uid}/meta/settings` for times and days, picks a coach line, and calls the FCM HTTP v1 API. It runs on a GitHub Actions schedule (every 30 minutes). See `docs/12-push-sender-contract.md` for the exact contract.

---

## Honest Limits

| Limit | Details |
|---|---|
| **Push best-effort** | The sender is in a separate repo and not yet deployed. In-app reminders (coach overlay) work without it. |
| **iOS push** | Requires iOS 16.4+, Safari, and the app added to the Home Screen. Older iOS gets in-app reminders only. |
| **GitHub Actions schedule** | Cron jobs can be delayed up to 15 minutes on GitHub's free tier during peak times. |
| **Practice item links** | ~119 practice items have no verified links yet (marked `verified: false` in the seed). The app shows the item title and you can add your own links. |
| **Single user** | Firestore rules are owner-only; no sharing or multi-user features. |

---

## Running Tests

```bash
# Unit tests (no emulator needed)
pnpm test

# Firestore security rules tests (requires emulator running)
firebase emulators:start --only firestore
pnpm test:rules
```

---

## Tech Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · Zustand · Firebase (Auth, Firestore, Cloud Messaging, Hosting) · vite-plugin-pwa (Workbox, injectManifest) · Vitest · date-fns

---

*Built with ❤️ as a personal learning companion. Not affiliated with Striver, Kunal, or any DSA platform.*