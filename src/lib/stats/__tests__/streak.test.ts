import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../streak';
import { DayLog } from '@/types/sheet';

describe('Streak Calculation and Edge Cases', () => {
  it('calculates streak when today is active', () => {
    // 2026-10-18, 19, 20 active
    const dayLogs: Record<string, DayLog> = {
      '2026-10-18': { dayKey: '2026-10-18', completed: 2, revised: 0, minutes: 30 },
      '2026-10-19': { dayKey: '2026-10-19', completed: 1, revised: 0, minutes: 20 },
      '2026-10-20': { dayKey: '2026-10-20', completed: 1, revised: 0, minutes: 15 },
    };

    const res = calculateStreak(dayLogs, '2026-10-20');
    expect(res.currentStreak).toBe(3);
    expect(res.longestStreak).toBe(3);
    expect(res.activeDaysTotal).toBe(3);
  });

  it('keeps streak alive when today is in progress but yesterday was active', () => {
    // Today (2026-10-20) has no logged activity yet
    const dayLogs: Record<string, DayLog> = {
      '2026-10-18': { dayKey: '2026-10-18', completed: 2, revised: 0, minutes: 30 },
      '2026-10-19': { dayKey: '2026-10-19', completed: 1, revised: 0, minutes: 20 },
      '2026-10-20': { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0 },
    };

    const res = calculateStreak(dayLogs, '2026-10-20');
    expect(res.currentStreak).toBe(2); // Streak of 2 ending at yesterday
    expect(res.activeDaysTotal).toBe(2);
  });

  it('resets streak to 0 if neither today nor yesterday was active', () => {
    const dayLogs: Record<string, DayLog> = {
      '2026-10-18': { dayKey: '2026-10-18', completed: 2, revised: 0, minutes: 30 },
      // 2026-10-19 missed!
      '2026-10-20': { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0 },
    };

    const res = calculateStreak(dayLogs, '2026-10-20');
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(1);
  });

  it('preserves streak across a valid rest day without incrementing it', () => {
    // Mon: work (streak 1)
    // Tue: rest day (streak preserved at 1, does not increment)
    // Wed: work (streak becomes 2)
    const dayLogs: Record<string, DayLog> = {
      '2026-10-19': { dayKey: '2026-10-19', completed: 2, revised: 0, minutes: 30 }, // Mon
      '2026-10-20': { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0, restDay: true }, // Tue
      '2026-10-21': { dayKey: '2026-10-21', completed: 1, revised: 0, minutes: 20 }, // Wed
    };

    // If evaluated on Tue (today is rest day)
    const resTue = calculateStreak(dayLogs, '2026-10-20');
    expect(resTue.currentStreak).toBe(1); // Preserved from Mon, not incremented

    // If evaluated on Wed
    const resWed = calculateStreak(dayLogs, '2026-10-21');
    expect(resWed.currentStreak).toBe(2); // Mon (1) + Wed (1) = 2
  });

  it('enforces rest-day limit of max 1 per ISO week (second rest day in same week breaks streak)', () => {
    // All in 2026-W43:
    // Mon (10-19): work (streak 1)
    // Tue (10-20): rest day #1 (allowed, streak preserved = 1)
    // Wed (10-21): work (streak = 2)
    // Thu (10-22): rest day #2 in same week with 0 work! (Exceeds limit -> breaks streak!)
    // Fri (10-23): work (streak = 1)
    const dayLogs: Record<string, DayLog> = {
      '2026-10-19': { dayKey: '2026-10-19', completed: 1, revised: 0, minutes: 15 },
      '2026-10-20': { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0, restDay: true },
      '2026-10-21': { dayKey: '2026-10-21', completed: 1, revised: 0, minutes: 15 },
      '2026-10-22': { dayKey: '2026-10-22', completed: 0, revised: 0, minutes: 0, restDay: true },
      '2026-10-23': { dayKey: '2026-10-23', completed: 1, revised: 0, minutes: 15 },
    };

    const resFri = calculateStreak(dayLogs, '2026-10-23');
    expect(resFri.currentStreak).toBe(1); // 10-22 broke the streak because 10-20 already consumed week 43 rest day
  });

  it('allows rest days in different ISO weeks to preserve streak', () => {
    // Sun 2026-10-18 (Week 42): Rest day #1 (valid for week 42)
    // Mon 2026-10-19 (Week 43): Work (streak 1)
    // Tue 2026-10-20 (Week 43): Rest day #2 (valid for week 43)
    // Wed 2026-10-21 (Week 43): Work (streak 2)
    const dayLogs: Record<string, DayLog> = {
      '2026-10-17': { dayKey: '2026-10-17', completed: 1, revised: 0, minutes: 15 }, // Sat W42 (streak 1)
      '2026-10-18': { dayKey: '2026-10-18', completed: 0, revised: 0, minutes: 0, restDay: true }, // Sun W42 (preserves)
      '2026-10-19': { dayKey: '2026-10-19', completed: 1, revised: 0, minutes: 15 }, // Mon W43 (streak 2)
      '2026-10-20': { dayKey: '2026-10-20', completed: 0, revised: 0, minutes: 0, restDay: true }, // Tue W43 (preserves)
      '2026-10-21': { dayKey: '2026-10-21', completed: 1, revised: 0, minutes: 15 }, // Wed W43 (streak 3)
    };

    const res = calculateStreak(dayLogs, '2026-10-21');
    expect(res.currentStreak).toBe(3);
    expect(res.longestStreak).toBe(3);
  });

  it('correctly tracks longestStreak when past streak was greater than current streak', () => {
    const dayLogs: Record<string, DayLog> = {
      // 5-day streak in past
      '2026-10-01': { dayKey: '2026-10-01', completed: 1, revised: 0, minutes: 20 },
      '2026-10-02': { dayKey: '2026-10-02', completed: 1, revised: 0, minutes: 20 },
      '2026-10-03': { dayKey: '2026-10-03', completed: 1, revised: 0, minutes: 20 },
      '2026-10-04': { dayKey: '2026-10-04', completed: 1, revised: 0, minutes: 20 },
      '2026-10-05': { dayKey: '2026-10-05', completed: 1, revised: 0, minutes: 20 },
      // gap
      '2026-10-10': { dayKey: '2026-10-10', completed: 1, revised: 0, minutes: 20 },
    };

    const res = calculateStreak(dayLogs, '2026-10-10');
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(5);
  });
});
