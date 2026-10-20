import { formatInTimeZone } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the calendar dayKey (YYYY-MM-DD) for a given date in the specified timezone.
 * Defaults to Asia/Kolkata.
 */
export function getDayKey(date: Date = new Date(), tz: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(date, tz, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD dayKey into a UTC Date object at 00:00:00.
 * Using UTC avoids local Daylight Saving Time jumps when doing pure day arithmetic.
 */
export function parseDayKey(dayKey: string): Date {
  const [yearStr, monthStr, dayStr] = dayKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Adds or subtracts calendar days from a YYYY-MM-DD dayKey.
 */
export function addDaysToDayKey(dayKey: string, days: number): string {
  const d = parseDayKey(dayKey);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getPreviousDayKey(dayKey: string): string {
  return addDaysToDayKey(dayKey, -1);
}

export function getNextDayKey(dayKey: string): string {
  return addDaysToDayKey(dayKey, 1);
}

/**
 * Returns whole calendar days between dayKeyA and dayKeyB (dayKeyA - dayKeyB).
 */
export function diffDayKeys(dayKeyA: string, dayKeyB: string): number {
  const dateA = parseDayKey(dayKeyA);
  const dateB = parseDayKey(dayKeyB);
  const msDiff = dateA.getTime() - dateB.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/**
 * Returns ISO week key (e.g. "2026-W43") for a dayKey.
 */
export function getIsoWeekKey(dayKey: string): string {
  const d = parseDayKey(dayKey);
  const year = getISOWeekYear(d);
  const week = String(getISOWeek(d)).padStart(2, '0');
  return `${year}-W${week}`;
}

export function isTodayOrYesterday(dayKey: string, todayKey: string): boolean {
  return dayKey === todayKey || dayKey === getPreviousDayKey(todayKey);
}
