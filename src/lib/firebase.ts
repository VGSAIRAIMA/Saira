import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export const auth = authInstance;
export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();

/**
 * Returns the Firebase Messaging instance lazily.
 * Only call this from client code after the user has granted notification permission.
 * Never call it in tests, SSR, or when Firebase is not configured.
 *
 * Why lazy? firebase/messaging imports are heavy and fail in Node/test environments
 * that don't have a ServiceWorker API. A dynamic import avoids these issues.
 */
export async function getMessagingInstance() {
  if (!isFirebaseConfigured) return null;
  const { getMessaging } = await import('firebase/messaging');
  const app = !getApps().length ? null : getApp();
  if (!app) return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}
