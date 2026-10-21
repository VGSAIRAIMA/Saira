import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_REMINDER_SETTINGS,
  toCloudSettings,
  mergeCloudSettingsToLocal,
  saveReminderSettings,
} from '@/lib/reminderStorage';
import { useSheetStore } from '@/stores/useSheetStore';

// Mock localStorage for Node test runner
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, val: string) => { localStorageStore[key] = val; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); },
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock Firebase
let setDocMock = vi.fn().mockResolvedValue(undefined);
const docMock = vi.fn((_db, ...parts) => parts.join('/'));

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123' } },
  db: { _isMockDb: true },
  isFirebaseConfigured: true,
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(args[0], ...args.slice(1)),
  setDoc: (...args: unknown[]) => setDocMock(...args),
}));

describe('Settings Synchronization (Milestone 8 bugfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setDocMock = vi.fn().mockResolvedValue(undefined);
    useSheetStore.setState({ syncStatus: 'synced', syncError: null });
  });

  it('1. first sign-in writes all defaults to cloud with merge:true without missing fields', () => {
    const cloudPayload = toCloudSettings(DEFAULT_REMINDER_SETTINGS, 3);

    expect(cloudPayload).toEqual({
      tz: 'Asia/Kolkata',
      morningTime: '08:30',
      studyTime: '19:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      quietHoursStart: null,
      quietHoursEnd: null,
      quietHoursEnabled: false,
      snoozeMinutes: 15,
      maxSnoozeCount: 3,
      voiceEnabled: true,
      notificationsEnabled: false,
      coachTheme: 'classic',
      dailyTarget: 3,
    });

    // Merging existing cloud data preserves remote values
    const merged = mergeCloudSettingsToLocal({
      morningTime: '07:15',
      dailyTarget: 5,
      notificationsEnabled: true,
    });

    expect(merged.morningTime).toBe('07:15');
    expect(merged.notificationsEnabled).toBe(true);
    // Preserved other defaults
    expect(merged.studyTime).toBe('19:00');
    expect(merged.snoozeMinutes).toBe(15);
  });

  it('2. a settings change writes the flattened fields to the cloud doc users/{uid}/meta/settings', async () => {
    const updatedSettings = {
      ...DEFAULT_REMINDER_SETTINGS,
      morningTime: '06:45',
      studyTime: '20:30',
      coachTheme: 'hero' as const,
    };

    await saveReminderSettings(updatedSettings);

    expect(docMock).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'test-user-123',
      'meta',
      'settings'
    );
    expect(setDocMock).toHaveBeenCalledTimes(1);

    const callArgs = setDocMock.mock.calls[0];
    const writtenData = callArgs[1] as Record<string, unknown>;
    const options = callArgs[2] as { merge: boolean };

    expect(options).toEqual({ merge: true });
    expect(writtenData.morningTime).toBe('06:45');
    expect(writtenData.studyTime).toBe('20:30');
    expect(writtenData.coachTheme).toBe('hero');
    expect(writtenData.tz).toBe('Asia/Kolkata');
    expect(writtenData.maxSnoozeCount).toBe(3);
    // Must NOT be nested under { reminders: ... }
    expect(writtenData.reminders).toBeUndefined();
  });

  it('3. permission grant sets notificationsEnabled true in the cloud doc and local storage', async () => {
    const enabledSettings = {
      ...DEFAULT_REMINDER_SETTINGS,
      notificationsEnabled: true,
    };

    await saveReminderSettings(enabledSettings);

    const callArgs = setDocMock.mock.calls[0];
    const writtenData = callArgs[1] as Record<string, unknown>;

    expect(writtenData.notificationsEnabled).toBe(true);
    const local = JSON.parse(localStorage.getItem('saira:reminder_settings') || '{}');
    expect(local.notificationsEnabled).toBe(true);
  });

  it('4. a failed cloud write updates the sync status to error with message in the sync badge', async () => {
    setDocMock = vi.fn().mockRejectedValue(new Error('Network offline or permission-denied'));

    await saveReminderSettings(DEFAULT_REMINDER_SETTINGS);

    const storeState = useSheetStore.getState();
    expect(storeState.syncStatus).toBe('error');
    expect(storeState.syncError).toContain('Network offline or permission-denied');

    // Subsequent successful write clears the error
    setDocMock = vi.fn().mockResolvedValue(undefined);
    await saveReminderSettings(DEFAULT_REMINDER_SETTINGS);

    expect(useSheetStore.getState().syncStatus).toBe('synced');
    expect(useSheetStore.getState().syncError).toBeNull();
  });

  it('5. setDailyTarget failure also marks syncStatus as error in the sync badge', async () => {
    setDocMock = vi.fn().mockRejectedValue(new Error('Firestore quota exceeded'));

    await useSheetStore.getState().setDailyTarget(5);

    expect(useSheetStore.getState().dailyTarget).toBe(5);
    expect(useSheetStore.getState().syncStatus).toBe('error');
    expect(useSheetStore.getState().syncError).toContain('Firestore quota exceeded');
  });
});
