import { describe, it, expect } from 'vitest';
import {
  getDayKey,
  parseDayKey,
  addDaysToDayKey,
  getPreviousDayKey,
  getNextDayKey,
  diffDayKeys,
  getIsoWeekKey,
  isTodayOrYesterday,
  DEFAULT_TIMEZONE,
} from '@/lib/time';

describe('Time and dayKey Utilities', () => {
  it('correctly handles Asia/Kolkata midnight rollover', () => {
    // 2026-10-19 23:59:00 IST is 2026-10-19 18:29:00 UTC
    const beforeMidnightUtc = new Date('2026-10-19T18:29:00.000Z');
    expect(getDayKey(beforeMidnightUtc, DEFAULT_TIMEZONE)).toBe('2026-10-19');

    // 2026-10-20 00:01:00 IST is 2026-10-19 18:31:00 UTC
    const afterMidnightUtc = new Date('2026-10-19T18:31:00.000Z');
    expect(getDayKey(afterMidnightUtc, DEFAULT_TIMEZONE)).toBe('2026-10-20');
  });

  it('handles DST sanity zone in America/New_York without calendar date drift', () => {
    // America/New_York DST change in Nov 2026 (Fall back)
    const dstDate1 = new Date('2026-11-01T05:00:00.000Z'); // 1 AM EDT
    const dstDate2 = new Date('2026-11-01T15:00:00.000Z'); // 10 AM EST
    expect(getDayKey(dstDate1, 'America/New_York')).toBe('2026-11-01');
    expect(getDayKey(dstDate2, 'America/New_York')).toBe('2026-11-01');
  });

  it('parses dayKey to UTC date correctly', () => {
    const d = parseDayKey('2026-10-20');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(9); // 0-indexed October
    expect(d.getUTCDate()).toBe(20);
  });

  it('adds and subtracts days accurately', () => {
    expect(addDaysToDayKey('2026-10-20', 1)).toBe('2026-10-21');
    expect(addDaysToDayKey('2026-10-20', -1)).toBe('2026-10-19');
    expect(addDaysToDayKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToDayKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(getPreviousDayKey('2026-10-20')).toBe('2026-10-19');
    expect(getNextDayKey('2026-10-20')).toBe('2026-10-21');
  });

  it('calculates diff in whole calendar days', () => {
    expect(diffDayKeys('2026-10-20', '2026-10-15')).toBe(5);
    expect(diffDayKeys('2026-10-15', '2026-10-20')).toBe(-5);
    expect(diffDayKeys('2026-10-20', '2026-10-20')).toBe(0);
  });

  it('computes ISO week key consistently', () => {
    // 2026-10-20 is a Tuesday in Week 43 of 2026
    expect(getIsoWeekKey('2026-10-20')).toBe('2026-W43');
    // Sunday of the same week
    expect(getIsoWeekKey('2026-10-25')).toBe('2026-W43');
    // Monday of next week
    expect(getIsoWeekKey('2026-10-26')).toBe('2026-W44');
  });

  it('checks isTodayOrYesterday properly', () => {
    expect(isTodayOrYesterday('2026-10-20', '2026-10-20')).toBe(true);
    expect(isTodayOrYesterday('2026-10-19', '2026-10-20')).toBe(true);
    expect(isTodayOrYesterday('2026-10-18', '2026-10-20')).toBe(false);
  });
});
