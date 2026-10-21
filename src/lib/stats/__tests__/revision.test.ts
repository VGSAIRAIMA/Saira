import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNextRevisionStep,
  getRevisionIntervalDays,
  calculateRevisionDueDate,
  createInitialRevisionState,
  REVISION_INTERVALS,
} from '../revision';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';

describe('Spaced Revision Logic & Intervals', () => {
  it('defines the correct standard revision intervals: [1, 3, 7, 21, 60]', () => {
    expect(REVISION_INTERVALS).toEqual([1, 3, 7, 21, 60]);
    expect(getRevisionIntervalDays(0)).toBe(1);
    expect(getRevisionIntervalDays(1)).toBe(3);
    expect(getRevisionIntervalDays(2)).toBe(7);
    expect(getRevisionIntervalDays(3)).toBe(21);
    expect(getRevisionIntervalDays(4)).toBe(60);
  });

  it('clamps out-of-range steps safely', () => {
    expect(getRevisionIntervalDays(-1)).toBe(1);
    expect(getRevisionIntervalDays(10)).toBe(60);
  });

  it('advances revision step when confidence >= 3', () => {
    expect(getNextRevisionStep(0, 3)).toBe(1);
    expect(getNextRevisionStep(1, 4)).toBe(2);
    expect(getNextRevisionStep(2, 5)).toBe(3);
    expect(getNextRevisionStep(3, 4)).toBe(4);
    expect(getNextRevisionStep(4, 5)).toBe(4); // Capped at max interval
  });

  it('defaults to confidence 3 (advance) when confidence rating is omitted', () => {
    expect(getNextRevisionStep(0)).toBe(1);
    expect(getNextRevisionStep(1)).toBe(2);
  });

  it('steps back revision step by one level when confidence <= 2', () => {
    expect(getNextRevisionStep(4, 2)).toBe(3);
    expect(getNextRevisionStep(3, 2)).toBe(2);
    expect(getNextRevisionStep(2, 1)).toBe(1);
    expect(getNextRevisionStep(1, 2)).toBe(0);
    expect(getNextRevisionStep(0, 1)).toBe(0); // Floor is step 0 (never negative)
  });

  it('calculates revision due date from a starting dayKey accurately across calendar months', () => {
    expect(calculateRevisionDueDate('2026-10-20', 0)).toBe('2026-10-21'); // +1 day
    expect(calculateRevisionDueDate('2026-10-20', 1)).toBe('2026-10-23'); // +3 days
    expect(calculateRevisionDueDate('2026-10-20', 2)).toBe('2026-10-27'); // +7 days
    expect(calculateRevisionDueDate('2026-10-20', 3)).toBe('2026-11-10'); // +21 days
    expect(calculateRevisionDueDate('2026-10-20', 4)).toBe('2026-12-19'); // +60 days

    // Month rollover (October 31 -> November 1)
    expect(calculateRevisionDueDate('2026-10-31', 0)).toBe('2026-11-01');
    // Year rollover (December 31 -> January 1)
    expect(calculateRevisionDueDate('2026-12-31', 0)).toBe('2027-01-01');
  });

  it('creates initial revision state for newly completed items', () => {
    const state = createInitialRevisionState('2026-10-20');
    expect(state.step).toBe(0);
    expect(state.dueDayKey).toBe('2026-10-21');
  });

  describe('completeRevision Store Action Integration', () => {
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const testItemId = 'p0-test-item';

    beforeEach(() => {
      useSheetStore.setState({
        isLoaded: true,
        progress: {
          [testItemId]: {
            status: 'done',
            confidence: 3,
            revision: {
              step: 1, // Currently at step 1 (3-day interval)
              dueDayKey: todayKey,
              lastRevisedAt: null,
            },
            updatedAt: new Date().toISOString(),
          },
        },
        dayLogs: {
          [todayKey]: {
            dayKey: todayKey,
            completed: 1,
            revised: 0,
            minutes: 30,
          },
        },
      });
    });

    it('advances revision step and increments dayLog revised count on confidence >= 3', async () => {
      const store = useSheetStore.getState();

      await store.completeRevision(testItemId, 4, 15);

      const updated = useSheetStore.getState();
      const updatedItem = updated.progress[testItemId];

      // Step advanced from 1 to 2
      expect(updatedItem.revision?.step).toBe(2);
      expect(updatedItem.confidence).toBe(4);
      // Next due date is today + 7 days
      expect(updatedItem.revision?.dueDayKey).toBe(calculateRevisionDueDate(todayKey, 2));
      expect(updatedItem.revision?.lastRevisedAt).toBeTruthy();

      // DayLog revised count atomically incremented
      expect(updated.dayLogs[todayKey].revised).toBe(1);
      expect(updated.dayLogs[todayKey].minutes).toBe(45); // 30 + 15
    });

    it('steps back revision step on confidence <= 2 and still increments dayLog revised count', async () => {
      const store = useSheetStore.getState();

      // Confidence 2 steps back from step 1 to step 0
      await store.completeRevision(testItemId, 2, 20);

      const updated = useSheetStore.getState();
      const updatedItem = updated.progress[testItemId];

      // Step backed up from 1 to 0
      expect(updatedItem.revision?.step).toBe(0);
      expect(updatedItem.confidence).toBe(2);
      // Next due date is today + 1 day
      expect(updatedItem.revision?.dueDayKey).toBe(calculateRevisionDueDate(todayKey, 0));

      // DayLog revised count still incremented for the study effort
      expect(updated.dayLogs[todayKey].revised).toBe(1);
      expect(updated.dayLogs[todayKey].minutes).toBe(50); // 30 + 20
    });
  });
});
