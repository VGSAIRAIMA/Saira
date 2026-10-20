import { DayLog } from '@/types/sheet';
import { parseDayKey, getIsoWeekKey } from '@/lib/time';
import { isActiveDay, isPureRestDay, ActiveDayOptions } from './activeDay';

/**
 * Calculates consistency score over the last 30 days:
 * active days in last 30 ÷ 30
 * Max 1 pure rest day per ISO week can count.
 */
export function calculateConsistency30(
  dayLogs: Record<string, DayLog> | DayLog[],
  todayKey: string,
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

  const weekRestDaysUsed = new Set<string>();
  let activeCount = 0;

  const current = parseDayKey(todayKey);
  for (let i = 0; i < 30; i++) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;

    const log = logsMap.get(dayKey);
    if (log) {
      const isPureRest = isPureRestDay(log, options);
      if (isPureRest) {
        const weekKey = getIsoWeekKey(dayKey);
        if (!weekRestDaysUsed.has(weekKey)) {
          weekRestDaysUsed.add(weekKey);
          activeCount++;
        }
      } else if (isActiveDay(log, options)) {
        activeCount++;
      }
    }

    current.setUTCDate(current.getUTCDate() - 1);
  }

  return Math.round((activeCount / 30) * 1000) / 1000;
}
