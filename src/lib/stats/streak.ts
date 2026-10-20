import { DayLog } from '@/types/sheet';
import {
  parseDayKey,
  getPreviousDayKey,
  diffDayKeys,
  getIsoWeekKey,
  DEFAULT_TIMEZONE,
  getDayKey,
} from '@/lib/time';
import { isPureRestDay, ActiveDayOptions } from './activeDay';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  activeDaysTotal: number;
}

type DayStatus = 'work' | 'rest' | 'inactive';

/**
 * Normalizes dayLogs into a map keyed by dayKey (YYYY-MM-DD).
 */
function normalizeDayLogs(dayLogs: Record<string, DayLog> | DayLog[]): Map<string, DayLog> {
  const map = new Map<string, DayLog>();
  if (Array.isArray(dayLogs)) {
    for (const log of dayLogs) {
      if (log?.dayKey) {
        map.set(log.dayKey, log);
      }
    }
  } else if (dayLogs) {
    for (const [key, log] of Object.entries(dayLogs)) {
      if (log) {
        map.set(log.dayKey || key, log);
      }
    }
  }
  return map;
}

/**
 * Classifies all recorded days into 'work', 'rest', or 'inactive'.
 * Enforces the domain rule: max 1 pure rest day per ISO week (chronologically first).
 */
function classifyDayLogs(
  logsMap: Map<string, DayLog>,
  options?: ActiveDayOptions
): Map<string, DayStatus> {
  const statusMap = new Map<string, DayStatus>();
  const allKeys = Array.from(logsMap.keys()).sort();

  const threshold = options?.activeThresholdMinutes ?? 15;
  const weekRestDaysUsed = new Set<string>();

  for (const key of allKeys) {
    const log = logsMap.get(key);
    if (!log) {
      statusMap.set(key, 'inactive');
      continue;
    }

    const actions = (log.completed || 0) + (log.revised || 0);
    const minutes = log.minutes || 0;

    if (actions >= 1 || minutes >= threshold) {
      statusMap.set(key, 'work');
    } else if (isPureRestDay(log, options)) {
      const weekKey = getIsoWeekKey(key);
      if (!weekRestDaysUsed.has(weekKey)) {
        weekRestDaysUsed.add(weekKey);
        statusMap.set(key, 'rest');
      } else {
        // Exceeded 1 rest day in this ISO week
        statusMap.set(key, 'inactive');
      }
    } else {
      statusMap.set(key, 'inactive');
    }
  }

  return statusMap;
}

/**
 * Calculates current streak, longest streak, and total active days.
 *
 * Domain Rules (AGENTS.md / PRD / Tech Requirements):
 * - Active day: >= 1 completed or revised, or >= 15 min, or max 1 valid rest day per ISO week.
 * - Pure rest day preserves the streak without incrementing it.
 * - If today is not active yet (in progress), the streak is alive ending at yesterday.
 */
export function calculateStreak(
  dayLogs: Record<string, DayLog> | DayLog[],
  todayKey: string = getDayKey(new Date(), DEFAULT_TIMEZONE),
  options?: ActiveDayOptions
): StreakResult {
  const logsMap = normalizeDayLogs(dayLogs);
  const statusMap = classifyDayLogs(logsMap, options);

  // 1. Total active days
  let activeDaysTotal = 0;
  for (const status of statusMap.values()) {
    if (status === 'work' || status === 'rest') {
      activeDaysTotal++;
    }
  }

  // 2. Current streak
  const todayStatus = statusMap.get(todayKey) ?? 'inactive';
  let currentStreak = 0;

  let evalKey: string;
  if (todayStatus === 'work' || todayStatus === 'rest') {
    evalKey = todayKey;
  } else {
    // Today is not active yet. Streak extends if yesterday was active.
    evalKey = getPreviousDayKey(todayKey);
  }

  let pointerKey = evalKey;
  while (true) {
    const status = statusMap.get(pointerKey);
    if (!status || status === 'inactive') {
      break;
    }

    if (status === 'work') {
      currentStreak++;
    }
    // If status === 'rest', streak is preserved without incrementing

    pointerKey = getPreviousDayKey(pointerKey);
  }

  // 3. Longest streak across all history
  const allKeys = Array.from(logsMap.keys()).sort();
  let longestStreak = 0;

  if (allKeys.length > 0) {
    const minDayKey = allKeys[0];
    const maxDayKey = allKeys[allKeys.length - 1];
    const totalSpan = diffDayKeys(maxDayKey, minDayKey);

    let runningStreak = 0;
    const currentDay = parseDayKey(minDayKey);

    for (let i = 0; i <= totalSpan; i++) {
      const y = currentDay.getUTCFullYear();
      const m = String(currentDay.getUTCMonth() + 1).padStart(2, '0');
      const d = String(currentDay.getUTCDate()).padStart(2, '0');
      const dayKey = `${y}-${m}-${d}`;

      const status = statusMap.get(dayKey);
      if (status === 'work') {
        runningStreak++;
      } else if (status === 'rest') {
        // Preserves streak
      } else {
        runningStreak = 0;
      }

      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }

      currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    activeDaysTotal,
  };
}
