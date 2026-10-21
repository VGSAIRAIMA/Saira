/**
 * deleteAccount.ts
 *
 * "Delete my data" flow — called from the Settings page after the user
 * types "DELETE" to confirm. Never touches real Firestore in unit tests
 * because all Firebase imports are injected as parameters.
 *
 * Steps (in order):
 *   1. Delete Firestore data in paginated batches (users/{uid}/**)
 *   2. Delete this device's FCM token
 *   3. Re-authenticate with Google (reauthenticateWithPopup)
 *   4. Delete the Firebase Auth user account
 *   (Caller signs out and navigates away after this resolves.)
 */

import {
  collection,
  getDocs,
  writeBatch,
  Firestore,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { User, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';

/** Max documents per Firestore batch (hard limit is 500) */
const BATCH_SIZE = 400;

/** Sub-collections under users/{uid} that hold user data */
const SUBCOLLECTIONS = [
  'progress',
  'custom',
  'days',
  'weeks',
  'favorites',
  'devices',
  'meta',
] as const;

/**
 * Delete all documents inside a sub-collection in batches.
 * Returns the number of documents deleted.
 */
async function deleteCollection(
  db: Firestore,
  colRef: CollectionReference<DocumentData>,
  onProgress?: (deleted: number) => void
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const snap = await getDocs(colRef);
    if (snap.empty) break;

    const docs = snap.docs;
    // Process in BATCH_SIZE chunks
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const d of chunk) {
        batch.delete(d.ref);
      }
      await batch.commit();
      totalDeleted += chunk.length;
      onProgress?.(totalDeleted);
    }

    // If we got fewer docs than we can hold in a batch, we're done
    if (docs.length < BATCH_SIZE) break;
  }

  return totalDeleted;
}

export interface DeleteAccountOptions {
  db: Firestore;
  user: User;
  /** Called with the running count of Firestore docs deleted */
  onProgress?: (deleted: number) => void;
}

/**
 * Full account deletion:
 *   1. Wipes all Firestore sub-collections for this user.
 *   2. Deletes the FCM device token (best-effort).
 *   3. Re-authenticates with Google popup (required by Firebase for deletion).
 *   4. Deletes the Firebase Auth user.
 *
 * Throws if re-auth is cancelled or fails.
 * The caller is responsible for signing out and navigating away.
 */
export async function deleteAccount({
  db,
  user,
  onProgress,
}: DeleteAccountOptions): Promise<void> {
  const uid = user.uid;

  // 1. Delete all sub-collection documents
  for (const sub of SUBCOLLECTIONS) {
    const colRef = collection(db, `users/${uid}/${sub}`);
    await deleteCollection(db, colRef, onProgress);
  }

  // 2. Delete FCM device token — best-effort; ignore if it fails
  try {
    const { deleteFcmToken } = await import('@/lib/fcm');
    await deleteFcmToken(uid);
  } catch {
    // best-effort
  }

  // 3. Re-authenticate — Firebase requires a recent sign-in before deleteUser
  const provider = new GoogleAuthProvider();
  await reauthenticateWithPopup(user, provider);

  // 4. Delete the Auth user account
  await user.delete();
}
