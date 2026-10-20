import { DayLog, Settings } from '@/types/sheet';

export interface ActiveDayOptions {
  activeThresholdMinutes?: number;
}

/**
 * Checks whether a single day log qualifies as an active day.
 * Criteria per AGENTS.md / PRD:
 * - >= 1 item completed or revised
 * - OR >= 15 minutes logged (configurable in settings)
 * - OR marked as rest day
 */
export function isActiveDay(
  log: DayLog | undefined | null,
  options?: ActiveDayOptions | Partial<Settings>
): boolean {
  if (!log) return false;

  const threshold = options?.activeThresholdMinutes ?? 15;
  const actionsCount = (log.completed || 0) + (log.revised || 0);
  const minutes = log.minutes || 0;

  if (actionsCount >= 1) return true;
  if (minutes >= threshold) return true;
  if (log.restDay === true) return true;

  return false;
}

/**
 * Returns true if the day was active exclusively through a rest day declaration
 * (no items completed/revised and minutes below the threshold).
 * Pure rest days preserve streak but do not increment it.
 */
export function isPureRestDay(
  log: DayLog | undefined | null,
  options?: ActiveDayOptions | Partial<Settings>
): boolean {
  if (!log || !log.restDay) return false;
  const threshold = options?.activeThresholdMinutes ?? 15;
  const actionsCount = (log.completed || 0) + (log.revised || 0);
  const minutes = log.minutes || 0;
  return actionsCount === 0 && minutes < threshold;
}
