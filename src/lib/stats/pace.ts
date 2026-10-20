import { DayLog } from '@/types/sheet';
import { addDaysToDayKey, parseDayKey } from '@/lib/time';
import { isActiveDay, ActiveDayOptions } from './activeDay';

/**
 * Calculates learning pace (items completed per active study day) over a rolling window.
 * Default window is 14 days.
 */
export function calculatePace(
  dayLogs: Record<string, DayLog> | DayLog[],
  todayKey: string,
  windowDays: number = 14,
  options?: ActiveDayOptions
): number {
  const logsMap = new Map<string, DayLog>();
  if (Array.isArray(dayLogs)) {
    for (const log of dayLogs) {
      if (log?.dayKey) logsMap.set(log.dayKey, log);
    }
  } else if (dayLogs) {
    for (const [key, log] of Object.entries(dayLogs)) {
      if (log) logsMap.set(log.dayKey || key, log);
    }
  }

  let activeDaysCount = 0;
  let itemsCompletedTotal = 0;

  const current = parseDayKey(todayKey);
  for (let i = 0; i < windowDays; i++) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    const log = logsMap.get(key);
    if (log && isActiveDay(log, options)) {
      activeDaysCount++;
      itemsCompletedTotal += log.completed || 0;
    }

    current.setUTCDate(current.getUTCDate() - 1);
  }

  if (activeDaysCount === 0) {
    return 0;
  }

  return Math.round((itemsCompletedTotal / activeDaysCount) * 100) / 100;
}

/**
 * Calculates projected date of completion based on remaining items and pace.
 * Returns null if pace is 0. Returns todayKey if remainingItems <= 0.
 */
export function calculateProjectedFinish(
  todayKey: string,
  remainingItems: number,
  pace: number
): string | null {
  if (remainingItems <= 0) {
    return todayKey;
  }
  if (!pace || pace <= 0) {
    return null;
  }

  const daysNeeded = Math.ceil(remainingItems / pace);
  return addDaysToDayKey(todayKey, daysNeeded);
}
