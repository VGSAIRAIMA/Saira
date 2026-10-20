import { describe, it, expect } from 'vitest';
import { calculatePace, calculateProjectedFinish } from '../pace';
import { DayLog } from '@/types/sheet';

describe('Pace and Projected Finish Calculations', () => {
  it('calculates average items completed per active day within 14-day window', () => {
    // 5 active days with a total of 15 completed items
    const dayLogs: Record<string, DayLog> = {
      '2026-10-20': { dayKey: '2026-10-20', completed: 3, revised: 0, minutes: 30 },
      '2026-10-19': { dayKey: '2026-10-19', completed: 3, revised: 0, minutes: 30 },
      '2026-10-18': { dayKey: '2026-10-18', completed: 3, revised: 0, minutes: 30 },
      '2026-10-17': { dayKey: '2026-10-17', completed: 3, revised: 0, minutes: 30 },
      '2026-10-16': { dayKey: '2026-10-16', completed: 3, revised: 0, minutes: 30 },
    };

    const pace = calculatePace(dayLogs, '2026-10-20', 14);
    expect(pace).toBe(3); // 15 items / 5 active days = 3.0 items/day
  });

  it('ignores activity outside the 14-day window', () => {
    const dayLogs: Record<string, DayLog> = {
      '2026-10-20': { dayKey: '2026-10-20', completed: 2, revised: 0, minutes: 20 },
      // 20 days ago (outside 14-day window)
      '2026-09-30': { dayKey: '2026-09-30', completed: 100, revised: 0, minutes: 200 },
    };

    const pace = calculatePace(dayLogs, '2026-10-20', 14);
    expect(pace).toBe(2);
  });

  it('returns 0 when there are no active days in the window', () => {
    const pace = calculatePace({}, '2026-10-20', 14);
    expect(pace).toBe(0);
  });

  it('calculates projected finish date accurately based on pace', () => {
    // 100 items remaining at pace 5.0 items/day = 20 days
    const finish = calculateProjectedFinish('2026-10-20', 100, 5.0);
    expect(finish).toBe('2026-11-09');
  });

  it('rounds up partial days for projected finish', () => {
    // 10 items remaining at pace 3.0 items/day = ceil(10 / 3) = 4 days
    const finish = calculateProjectedFinish('2026-10-20', 10, 3.0);
    expect(finish).toBe('2026-10-24');
  });

  it('returns null when pace is 0', () => {
    expect(calculateProjectedFinish('2026-10-20', 50, 0)).toBeNull();
  });

  it('returns todayKey when remainingItems is 0', () => {
    expect(calculateProjectedFinish('2026-10-20', 0, 5.0)).toBe('2026-10-20');
  });
});
