import { create } from 'zustand';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: isFirebaseConfigured,
  error: null,
  isConfigured: isFirebaseConfigured,

  signInWithGoogle: async () => {
    if (!auth) {
      set({ error: 'Firebase is not configured yet. Check your .env settings.' });
      return null;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      set({ user: result.user, isLoading: false });
      return result.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  signOutUser: async () => {
    if (!auth) return;
    set({ isLoading: true, error: null });
    try {
      await firebaseSignOut(auth);
      set({ user: null, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: msg, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Initialize auth state listener if Firebase is configured
if (auth) {
  onAuthStateChanged(auth, (firebaseUser) => {
    useAuthStore.setState({
      user: firebaseUser,
      isLoading: false,
    });
  });
}
