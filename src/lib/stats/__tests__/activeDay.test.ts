import { describe, it, expect } from 'vitest';
import { isActiveDay, isPureRestDay } from '../activeDay';
import { DayLog } from '@/types/sheet';

describe('activeDay Logic', () => {
  it('returns true when completed >= 1', () => {
    const log: DayLog = { dayKey: '2026-10-20', completed: 1, revised: 0, minutes: 0 };
    expect(isActiveDay(log)).toBe(true);
    expect(isPureRestDay(log)).toBe(false);
  });

  it('returns true when revised >= 1', () => {
    const log: DayLog = { dayKey: '2026-10-20', completed: 0, revised: 1, minutes: 0 };
    expect(isActiveDay(log)).toBe(true);
    expect(isPureRestDay(log)).toBe(false);
  });

  it('returns true when minutes >= default threshold (15 min)', () => {
    const log1: DayLog = { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 15 };
    expect(isActiveDay(log1)).toBe(true);

    const log2: DayLog = { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 14 };
    expect(isActiveDay(log2)).toBe(false);
  });

  it('respects custom activeThresholdMinutes option', () => {
    const log: DayLog = { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 20 };
    expect(isActiveDay(log, { activeThresholdMinutes: 25 })).toBe(false);
    expect(isActiveDay(log, { activeThresholdMinutes: 20 })).toBe(true);
  });

  it('returns true when marked as restDay', () => {
    const log: DayLog = { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0, restDay: true };
    expect(isActiveDay(log)).toBe(true);
    expect(isPureRestDay(log)).toBe(true);
  });

  it('identifies pure rest day only when no other work was logged', () => {
    const restWithWork: DayLog = {
      dayKey: '2026-10-20',
      completed: 1,
      revised: 0,
      minutes: 10,
      restDay: true,
    };
    expect(isActiveDay(restWithWork)).toBe(true);
    expect(isPureRestDay(restWithWork)).toBe(false);
  });

  it('returns false for undefined, null, or empty logs', () => {
    expect(isActiveDay(undefined)).toBe(false);
    expect(isActiveDay(null)).toBe(false);
    expect(isPureRestDay(undefined)).toBe(false);
  });
});
