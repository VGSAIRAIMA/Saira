import { ReminderSettings, ReminderState } from '@/types/sheet';
import { auth, db } from '@/lib/firebase';
import type { User } from 'firebase/auth';


const REMINDER_SETTINGS_KEY = 'saira:reminder_settings';
const REMINDER_STATE_KEY = 'saira:reminder_state';

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  morningTime: '08:30',
  studyTime: '19:00',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Sun - Sat
  voiceEnabled: true,
  snoozeMinutes: 15,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  notificationsEnabled: false,
  coachTheme: 'classic',
};

export const DEFAULT_REMINDER_STATE: ReminderState = {
  lastFiredSlot: undefined,
  lastFiredDate: undefined,
  snoozeCount: 0,
  snoozeUntil: null,
  dismissedSlots: [],
  missedNudgeFiredForDate: undefined,
};

// BroadcastChannel for instant cross-tab synchronization
let reminderChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    reminderChannel = new BroadcastChannel('saira_reminders');
  } catch {
    // BroadcastChannel unsupported or restricted
  }
}

export function subscribeToReminderBroadcast(callback: (state: ReminderState) => void): () => void {
  if (!reminderChannel) {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === REMINDER_STATE_KEY && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'REMINDER_STATE_UPDATE') {
      callback(e.data.state);
    }
  };

  reminderChannel.addEventListener('message', handleMessage);
  return () => {
    reminderChannel?.removeEventListener('message', handleMessage);
  };
}

export function loadLocalReminderSettings(): ReminderSettings {
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_REMINDER_SETTINGS;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }

  // Cloud sync if signed in
  const user = auth?.currentUser;
  if (user && db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'users', user.uid, 'meta', 'settings'),
        { reminders: settings },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync reminder settings to Firestore:', err);
    }
  }
}

export function loadLocalReminderState(): ReminderState {
  try {
    const stored = localStorage.getItem(REMINDER_STATE_KEY);
    if (stored) {
      return { ...DEFAULT_REMINDER_STATE, ...JSON.parse(stored) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_REMINDER_STATE;
}

export async function saveReminderState(state: ReminderState): Promise<void> {
  try {
    localStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }

  // Broadcast to other tabs immediately
  if (reminderChannel) {
    try {
      reminderChannel.postMessage({ type: 'REMINDER_STATE_UPDATE', state });
    } catch {
      // ignore
    }
  }

  // Cloud sync to Firestore users/{uid}/meta/reminderState
  const user = auth?.currentUser;
  if (user && db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(
        doc(db, 'users', user.uid, 'meta', 'reminderState'),
        state,
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync reminder state to Firestore:', err);
    }
  }
}

/**
 * Derives the learner's first name from a Firebase Auth User object.
 *
 * Rules (same as every component in the app):
 *   - Take the first space-separated word of displayName.
 *   - Trim whitespace.
 *   - Fall back to "friend" when displayName is null, undefined, or empty.
 *
 * This is a pure function so it can be tested without Firebase.
 */
export function deriveFirstName(displayName: string | null | undefined): string {
  const trimmed = displayName?.trim() ?? '';
  if (!trimmed) return 'friend';
  return trimmed.split(' ')[0] ?? 'friend';
}

/**
 * Writes the user's first name to:
 *   - localStorage (inside the reminder settings blob)
 *   - Firestore: users/{uid}/meta/settings  { firstName: "Priya" }  (merge)
 *
 * Call this on every successful sign-in and on page reload when Firebase
 * confirms an existing session (inside onAuthStateChanged).
 *
 * The push sender reads firstName from the same settings doc it already
 * fetches, so it never needs an extra Firebase Auth Admin call.
 */
export async function syncFirstName(user: User): Promise<void> {
  const firstName = deriveFirstName(user.displayName);

  // 1. Persist locally so the in-app learner name stays correct offline.
  try {
    const current = loadLocalReminderSettings();
    if (current.firstName !== firstName) {
      const updated = { ...current, firstName };
      localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(updated));
    }
  } catch {
    // localStorage unavailable — not fatal
  }

  // 2. Sync to Firestore with merge so we never overwrite other settings fields.
  if (!user.uid || !db) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(
      doc(db, 'users', user.uid, 'meta', 'settings'),
      { firstName },
      { merge: true }
    );
  } catch (err) {
    console.warn('[syncFirstName] Could not sync to Firestore:', err);
  }
}
