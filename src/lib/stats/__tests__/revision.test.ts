import { describe, it, expect } from 'vitest';
import {
  getNextRevisionStep,
  getRevisionIntervalDays,
  calculateRevisionDueDate,
  createInitialRevisionState,
  REVISION_INTERVALS,
} from '../revision';

describe('Spaced Revision Logic', () => {
  it('defines the correct standard revision intervals: [1, 3, 7, 21, 60]', () => {
    expect(REVISION_INTERVALS).toEqual([1, 3, 7, 21, 60]);
    expect(getRevisionIntervalDays(0)).toBe(1);
    expect(getRevisionIntervalDays(1)).toBe(3);
    expect(getRevisionIntervalDays(2)).toBe(7);
    expect(getRevisionIntervalDays(3)).toBe(21);
    expect(getRevisionIntervalDays(4)).toBe(60);
  });

  it('advances revision step when confidence >= 3', () => {
    expect(getNextRevisionStep(0, 3)).toBe(1);
    expect(getNextRevisionStep(1, 4)).toBe(2);
    expect(getNextRevisionStep(2, 5)).toBe(3);
    expect(getNextRevisionStep(3, 4)).toBe(4);
    expect(getNextRevisionStep(4, 5)).toBe(4); // Capped at max interval
  });

  it('steps back revision step when confidence <= 2', () => {
    expect(getNextRevisionStep(3, 2)).toBe(2);
    expect(getNextRevisionStep(2, 1)).toBe(1);
    expect(getNextRevisionStep(1, 2)).toBe(0);
    expect(getNextRevisionStep(0, 1)).toBe(0); // Floor is step 0
  });

  it('calculates revision due date from a starting dayKey', () => {
    expect(calculateRevisionDueDate('2026-10-20', 0)).toBe('2026-10-21'); // +1 day
    expect(calculateRevisionDueDate('2026-10-20', 1)).toBe('2026-10-23'); // +3 days
    expect(calculateRevisionDueDate('2026-10-20', 2)).toBe('2026-10-27'); // +7 days
    expect(calculateRevisionDueDate('2026-10-20', 3)).toBe('2026-11-10'); // +21 days
    expect(calculateRevisionDueDate('2026-10-20', 4)).toBe('2026-12-19'); // +60 days
  });

  it('creates initial revision state for newly completed items', () => {
    const state = createInitialRevisionState('2026-10-20');
    expect(state.step).toBe(0);
    expect(state.dueDayKey).toBe('2026-10-21');
  });
});
