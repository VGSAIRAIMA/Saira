import { describe, it, expect } from 'vitest';
import { calculateConsistency30 } from '../consistency';
import { DayLog } from '@/types/sheet';
import { addDaysToDayKey } from '@/lib/time';

describe('Consistency30 Statistics Calculations', () => {
  it('returns 1.0 when all 30 days are active', () => {
    const dayLogs: Record<string, DayLog> = {};
    for (let i = 0; i < 30; i++) {
      const key = addDaysToDayKey('2026-10-20', -i);
      dayLogs[key] = { dayKey: key, completed: 1, revised: 0, minutes: 20 };
    }

    const score = calculateConsistency30(dayLogs, '2026-10-20');
    expect(score).toBe(1.0);
  });

  it('returns 0.5 when 15 of 30 days are active', () => {
    const dayLogs: Record<string, DayLog> = {};
    for (let i = 0; i < 15; i++) {
      const key = addDaysToDayKey('2026-10-20', -i);
      dayLogs[key] = { dayKey: key, completed: 1, revised: 0, minutes: 20 };
    }

    const score = calculateConsistency30(dayLogs, '2026-10-20');
    expect(score).toBe(0.5);
  });

  it('returns 0.0 when no days are active in the last 30 days', () => {
    const score = calculateConsistency30({}, '2026-10-20');
    expect(score).toBe(0.0);
  });
});
