import { describe, it, expect, beforeEach } from 'vitest';
import { useSheetStore } from '../useSheetStore';
import { persistProgressAndDayLog } from '@/lib/storage';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import {
  calculateStreak,
  calculateOverallCompletion,
  calculatePace,
} from '@/lib/stats';
import { allPhases } from '@/lib/seed';

describe('Fresh Start Load Bugfix Verification', () => {
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const sampleItemId = 'p0-git-and-github.1';

  beforeEach(() => {
    // Reset store to uninitialized initial state (simulating fresh app open)
    useSheetStore.setState({
      isLoaded: false,
      progress: {},
      customItems: [],
      dayLogs: {},
      hiddenIds: new Set(),
      lastTouchedId: null,
      dailyTarget: 3,
      favoriteQuoteIds: new Set(),
    });
  });

  it('proves that stats derived from the store are correct on a fresh start without visiting the Sheet page', async () => {
    const now = Date.now();

    // 1. Arrange: save data directly to storage (simulating previous session data in storage)
    await persistProgressAndDayLog(
      {
        [sampleItemId]: {
          status: 'done',
          completedAt: now,
          lastTouchedAt: now,
          updatedAt: now,
        },
      },
      {
        [todayKey]: {
          dayKey: todayKey,
          completed: 1,
          revised: 0,
          minutes: 25,
        },
      },
      sampleItemId
    );

    // Verify store is initially NOT loaded before startup initialization
    expect(useSheetStore.getState().isLoaded).toBe(false);
    expect(useSheetStore.getState().progress[sampleItemId]).toBeUndefined();

    // 2. Act: Trigger startup initialization (as executed in AppShell on root mount)
    // Notice: We do NOT visit or mount SheetPage here!
    await useSheetStore.getState().initialize();

    // 3. Assert: Store is now loaded and holds the persistent data
    const state = useSheetStore.getState();
    expect(state.isLoaded).toBe(true);
    expect(state.progress[sampleItemId]?.status).toBe('done');
    expect(state.dayLogs[todayKey]?.completed).toBe(1);

    // 4. Assert: Derived stats for Today and Progress pages are immediately non-zero
    const streakResult = calculateStreak(state.dayLogs, todayKey);
    expect(streakResult.currentStreak).toBe(1);

    const overallCompletion = calculateOverallCompletion(allPhases, state.progress, state.hiddenIds);
    expect(overallCompletion.completed).toBe(1);
    expect(overallCompletion.percentage).toBeGreaterThan(0);

    const pace = calculatePace(state.dayLogs, todayKey, 14);
    expect(pace).toBe(1);
  });

  it('guarantees initialize() is idempotent and does not reload if already loaded', async () => {
    // Mark as loaded with custom target
    useSheetStore.setState({
      isLoaded: true,
      dailyTarget: 7,
    });

    await useSheetStore.getState().initialize();

    // Should remain 7 because isLoaded guard prevented re-running initial load
    expect(useSheetStore.getState().dailyTarget).toBe(7);
  });
});
