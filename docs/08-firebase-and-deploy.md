# SAIRA: Firebase and Deployment

## 1. Project setup (one-time, by the learner)

1. Go to the Firebase console → **Add project** (`saira-dsa` or similar). Google Analytics not needed.
2. **Build → Authentication → Sign-in method → Google → Enable.** Add your deployed domain under *Settings → Authorized domains* later (`<project>.web.app` is added automatically).
3. **Build → Firestore Database → Create database** (production mode; choose a region near you, e.g. `asia-south1` Mumbai).
4. **Project settings → Your apps → Web app** → copy the config into `.env` (see `.env.example`).
5. **Project settings → Cloud Messaging → Web Push certificates → Generate key pair** → `VITE_FIREBASE_VAPID_KEY`.
6. Install the CLI: `npm i -g firebase-tools`, then `firebase login`, then in the repo `firebase use --add`.

Free (Spark) plan is enough for v1. Quotas change over time, so check the current Firebase pricing page; at one user with ~400 item docs and a few writes a day you are nowhere near them.

## 2. Firestore layout

```
users/{uid}
  profile            (doc fields: name, photoURL, createdAt)     // optional, from Auth
users/{uid}/progress/{itemId}      ItemProgress (see 03-tech-requirements)
users/{uid}/custom/{itemId}        CustomItem
users/{uid}/days/{dayKey}          DayLog { completed, revised, minutes, restDay? }   // dayKey = YYYY-MM-DD
users/{uid}/weeks/{isoWeek}        WeeklyReview { wentWell, hard, nextGoal, stats, createdAt }
users/{uid}/favorites/{quoteId}    { createdAt }
users/{uid}/meta/settings          Settings
users/{uid}/meta/reminderState     { lastFiredSlot: { [dayKey]: string[] } }
users/{uid}/devices/{deviceId}     { token, platform, tz, createdAt, lastSeenAt }
```
Design notes:
- One doc per item keeps writes tiny and conflicts rare (last-write-wins on `updatedAt`).
- `days/{dayKey}` is the aggregate that powers streaks, heatmap and pace, so analytics never scan every item. Update it in the same **batched write** as the item change.
- The bundled seed is static and not stored in Firestore.
- Never delete a `days` doc; only increment/decrement.

## 3. Security rules (`firestore.rules`)

Rules are OR-ed across matching blocks, so do **not** add a broad wildcard under `users/{uid}`; list collections explicitly.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    match /users/{uid} {
      allow read, write: if isOwner(uid);
    }

    match /users/{uid}/progress/{itemId} {
      allow read, delete: if isOwner(uid);
      allow create, update: if isOwner(uid)
        && request.resource.data.status in ['not_started','in_progress','done','needs_revision']
        && (!('notes' in request.resource.data) || request.resource.data.notes.size() <= 20000)
        && (!('keyIdea' in request.resource.data) || request.resource.data.keyIdea.size() <= 500)
        && (!('mistakes' in request.resource.data) || request.resource.data.mistakes.size() <= 2000);
    }

    match /users/{uid}/custom/{id}    { allow read, write: if isOwner(uid); }
    match /users/{uid}/days/{day}     { allow read, write: if isOwner(uid); }
    match /users/{uid}/weeks/{week}   { allow read, write: if isOwner(uid); }
    match /users/{uid}/favorites/{id} { allow read, write: if isOwner(uid); }
    match /users/{uid}/meta/{doc}     { allow read, write: if isOwner(uid); }
    match /users/{uid}/devices/{id}   { allow read, write: if isOwner(uid); }

    match /{document=**} { allow read, write: if false; }
  }
}
```
Add a rules unit test with `@firebase/rules-unit-testing` (owner can read/write own data; another user cannot; oversized notes rejected). The Admin SDK used by the push sender bypasses rules.

## 4. Client init (`src/lib/firebase.ts`)

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const app = initializeApp({ /* VITE_FIREBASE_* */ });
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```
Use `onSnapshot` listeners for `progress`, `days` and `meta/settings` so a tick on one device shows on the other within seconds. Show a sync indicator from `snapshot.metadata.hasPendingWrites` and `fromCache`.

## 5. Hosting config (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "/manifest.webmanifest", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "/assets/**", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
      { "source": "**", "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]}
    ]
  },
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }
}
```
Add a Content-Security-Policy header once the app works (allow `self`, Firebase/Google APIs and auth domains, the video host, `data:` images); test sign-in and push after adding it.

## 6. Deploy

Manual (first time and whenever you like):
```
pnpm install
pnpm build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```
The CLI prints the live URL (`https://<project>.web.app`). Open it in Chrome → install → test on your phone. After deploying, add the domain to Auth → Authorized domains if you use a custom domain.

Optional CI (GitHub Actions): `ci.yml` runs `pnpm i`, `tsc --noEmit`, `eslint`, `vitest run`, `pnpm build`; a deploy job can use `FirebaseExtended/action-hosting-deploy` with a service-account secret on `main`.

## 7. Backups and data safety

- In-app **Export JSON/CSV** (see sheet spec) is the user-level backup.
- Enable Firestore **scheduled backups or PITR** only if moving to a paid plan; otherwise rely on export.
- Account deletion: Settings → "Delete my data" removes `users/{uid}/**` (client batch deletes, paginated) and the Auth user after re-auth.

## 8. Environments

Keep two Firebase projects if you like: `saira-dev` (emulators: `firebase emulators:start` for Auth + Firestore) and `saira-prod`. At minimum use the **Emulator Suite** for rules tests and local development.
