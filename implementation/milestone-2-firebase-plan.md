# SAIRA: Milestone 2 (Firebase Cloud Sync) Implementation Plan

This document details the architecture, data merge rules, and implementation steps for connecting Firebase Authentication (Google) and Firestore offline-first synchronization to SAIRA.

---

## 1. Tooling & Architecture Guide (For Beginners)

- **Firebase Authentication**: A managed identity service that allows learners to securely sign in using their Google account with a single click, without handling passwords.
- **Cloud Firestore**: A scalable NoSQL document database in the cloud that stores your progress per item (`users/{uid}/progress/{itemId}`).
- **Firestore `persistentLocalCache`**: A feature of the Firestore web SDK that maintains an offline IndexedDB cache on your computer. When you tick items while offline, changes are written to the local cache immediately, and automatically sync to the cloud the moment internet reconnects.
- **First Sign-in Merge**: If you study DSA offline or before signing in, your local progress will be merged with your cloud account upon signing in. No progress is overwritten or lost.

---

## 2. Environment Variables (.env)

The application reads Firebase credentials exclusively from Vite environment variables prefixed with `VITE_`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> [!IMPORTANT]
> The `.env` file is included in `.gitignore` and must **never** be committed to Git. A `.env.example` template will be provided for reference.

---

## 3. The First Sign-in Merge Rules

When a learner who has already logged progress in local mode signs in with Google, SAIRA runs an atomic merge between local IndexedDB and cloud Firestore:

1. **Item Progress (`users/{uid}/progress/{itemId}`)**:
   - **Local Only**: Item exists locally but not in cloud $\rightarrow$ Uploaded to Firestore.
   - **Cloud Only**: Item exists in cloud but not locally $\rightarrow$ Downloaded to local IndexedDB.
   - **Both Exist**: Compared using `updatedAt` timestamp. The record with the newer `updatedAt` wins and synchronizes across both sides. User notes, confidence ratings, and timestamps are preserved.
2. **Day Logs (`users/{uid}/days/{dayKey}`)**:
   - Day logs power streaks, consistency, and study heatmaps.
   - For each calendar day:
     - `completed = Math.max(local.completed, cloud.completed)`
     - `revised = Math.max(local.revised, cloud.revised)`
     - `minutes = Math.max(local.minutes, cloud.minutes)`
     - `restDay = local.restDay || cloud.restDay`
   - *Rule*: Progress metrics are non-destructive and never reduced during a merge.
3. **Custom Items (`users/{uid}/custom/{id}`)**:
   - Union by `id`. Items created on either device are combined.
4. **Hidden Items**:
   - Union of hidden item IDs across local and cloud.

---

## 4. Security Rules (`firestore.rules`)

Per `docs/08-firebase-and-deploy.md §3`:
- Only authenticated users matching `request.auth.uid == uid` can read or write their own documents under `users/{uid}/**`.
- Progress documents validate:
  - `status in ['not_started', 'in_progress', 'done', 'needs_revision']`
  - Notes size $\le 20,000$ characters
  - Key idea size $\le 500$ characters
  - Mistakes size $\le 2,000$ characters

---

## 5. Implementation Steps

1. Create `.env.example`.
2. Install `firebase` package (`pnpm add firebase`).
3. Build `src/lib/firebase.ts` with conditional initialization (safe when credentials are empty).
4. Build `src/stores/useAuthStore.ts` for Google Auth state.
5. Build `src/lib/sync.ts` containing:
   - Conflict-free merge algorithm (`mergeLocalAndCloudData`).
   - Realtime Firestore snapshot listeners syncing cloud changes to `useSheetStore`.
   - Online/offline network status detection.
6. Connect `useSheetStore` to write through to Firestore when signed in.
7. Write `firestore.rules` per spec.
8. Add unit tests for the merge algorithm in `src/lib/__tests__/sync-merge.test.ts`.
9. Update `AppShell.tsx` and `LoginPage.tsx` with Google Sign-In button, user avatar, and sync status badge (`Synced`, `Syncing...`, `Offline`, `Local Mode`).
10. Run lint, typecheck, tests, and build, and update `docs/PROGRESS.md`.
