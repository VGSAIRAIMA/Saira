import { ReminderSettings, ReminderState, DayLog } from '@/types/sheet';
import { getDayKey, getPreviousDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import { isActiveDay, isPureRestDay } from '@/lib/stats/activeDay';

export type ReminderSlot = 'morning' | 'study';

export interface ScheduleEvaluationInput {
  currentTime?: Date | number;
  tz?: string;
  settings: ReminderSettings;
  dailyTarget: number;
  dayLogs: Record<string, DayLog>;
  reminderState: ReminderState;
  userName?: string;
}

export interface ScheduleEvaluationResult {
  action: 'fire' | 'wait' | 'skip';
  slot?: ReminderSlot;
  lineCategory?: 'morning' | 'study' | 'nudge_missed' | 'done_today';
  reason?: string;
  nextCheckTimeMs?: number;
}

/**
 * Parses "HH:mm" time string into minutes from midnight (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const h = parseInt(hoursStr, 10) || 0;
  const m = parseInt(minutesStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Formats time of a Date object into minutes from midnight in the specified timezone.
 */
export function getDateMinutesInTz(date: Date, tz: string = DEFAULT_TIMEZONE): number {
  // Use Intl.DateTimeFormat to reliably extract local hour and minute in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let hour = 0;
  let minute = 0;

  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10) % 24;
    if (part.type === 'minute') minute = parseInt(part.value, 10);
  }

  return hour * 60 + minute;
}

/**
 * Gets day of week (0 = Sunday ... 6 = Saturday) in the specified timezone.
 */
export function getDayOfWeekInTz(date: Date, tz: string = DEFAULT_TIMEZONE): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  });
  const shortDay = formatter.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[shortDay] ?? 0;
}

/**
 * Pure evaluation of whether a reminder slot should fire right now.
 * Supports fake clock injection via `currentTime`.
 */
export function evaluateSchedule(input: ScheduleEvaluationInput): ScheduleEvaluationResult {
  const tz = input.tz || DEFAULT_TIMEZONE;
  const dateObj =
    typeof input.currentTime === 'number'
      ? new Date(input.currentTime)
      : input.currentTime instanceof Date
      ? input.currentTime
      : new Date();

  const currentMs = dateObj.getTime();
  const todayKey = getDayKey(dateObj, tz);
  const currentMinutes = getDateMinutesInTz(dateObj, tz);
  const currentDayOfWeek = getDayOfWeekInTz(dateObj, tz);

  const { settings, dailyTarget, dayLogs, reminderState } = input;

  // 1. Check active Snooze
  if (reminderState.snoozeUntil && reminderState.snoozeUntil > 0) {
    if (currentMs >= reminderState.snoozeUntil) {
      const slot = (reminderState.lastFiredSlot as ReminderSlot) || 'study';
      return {
        action: 'fire',
        slot,
        lineCategory: slot === 'morning' ? 'morning' : 'study',
        reason: 'snooze_due',
      };
    }
    return {
      action: 'wait',
      reason: 'snooze_pending',
      nextCheckTimeMs: reminderState.snoozeUntil,
    };
  }

  // 2. Day of Week Check
  if (settings.daysOfWeek && !settings.daysOfWeek.includes(currentDayOfWeek)) {
    return { action: 'skip', reason: 'day_not_scheduled' };
  }

  // 3. Quiet Hours Check
  if (settings.quietHoursEnabled) {
    const qStart = parseTimeToMinutes(settings.quietHoursStart);
    const qEnd = parseTimeToMinutes(settings.quietHoursEnd);
    const inQuietHours =
      qStart < qEnd
        ? currentMinutes >= qStart && currentMinutes < qEnd
        : currentMinutes >= qStart || currentMinutes < qEnd;

    if (inQuietHours) {
      return { action: 'skip', reason: 'quiet_hours' };
    }
  }

  // 4. Goal Already Met Check
  const todayLog = dayLogs[todayKey];
  const completedToday = todayLog?.completed || 0;
  if (completedToday >= dailyTarget) {
    return { action: 'skip', reason: 'goal_already_met' };
  }

  // Slot definitions
  const morningMinutes = parseTimeToMinutes(settings.morningTime || '08:30');
  const studyMinutes = parseTimeToMinutes(settings.studyTime || '19:00');

  const morningFiredOrDismissed =
    (reminderState.lastFiredDate === todayKey && reminderState.lastFiredSlot === 'morning') ||
    reminderState.dismissedSlots?.includes(`${todayKey}:morning`);

  const studyFiredOrDismissed =
    (reminderState.lastFiredDate === todayKey && reminderState.lastFiredSlot === 'study') ||
    reminderState.dismissedSlots?.includes(`${todayKey}:study`);

  // 5. Morning Slot Evaluation (fires if currentMinutes is within [morningMinutes, morningMinutes + 30])
  if (!morningFiredOrDismissed) {
    const diff = currentMinutes - morningMinutes;
    if (diff >= 0 && diff <= 30) {
      return {
        action: 'fire',
        slot: 'morning',
        lineCategory: 'morning',
        reason: 'morning_slot_due',
      };
    }
  }

  // 6. Study / Evening Slot Evaluation (fires if currentMinutes is within [studyMinutes, studyMinutes + 30])
  if (!studyFiredOrDismissed) {
    const diff = currentMinutes - studyMinutes;
    if (diff >= 0 && diff <= 30) {
      // Check for missed day yesterday
      const yesterdayKey = getPreviousDayKey(todayKey);
      const yesterdayLog = dayLogs[yesterdayKey];
      const wasYesterdayActive =
        yesterdayLog && (isActiveDay(yesterdayLog) || isPureRestDay(yesterdayLog));

      const isMissedNudge =
        !wasYesterdayActive && reminderState.missedNudgeFiredForDate !== todayKey;

      return {
        action: 'fire',
        slot: 'study',
        lineCategory: isMissedNudge ? 'nudge_missed' : 'study',
        reason: isMissedNudge ? 'missed_day_evening_slot_due' : 'study_slot_due',
      };
    }
  }

  return { action: 'wait', reason: 'no_slot_active' };
}

/**
 * Snooze helper: adds snoozeMinutes (default 15m), up to maximum 3 snoozes.
 */
export function applySnooze(
  state: ReminderState,
  snoozeMinutes: number = 15,
  currentTimeMs: number = Date.now()
): { state: ReminderState; success: boolean; reason?: string } {
  const currentCount = state.snoozeCount || 0;
  if (currentCount >= 3) {
    return {
      state,
      success: false,
      reason: 'max_snoozes_reached',
    };
  }

  const nextCount = currentCount + 1;
  const snoozeUntil = currentTimeMs + snoozeMinutes * 60 * 1000;

  return {
    success: true,
    state: {
      ...state,
      snoozeCount: nextCount,
      snoozeUntil,
    },
  };
}

/**
 * Dismiss helper: records slot as dismissed for today, clears snooze.
 */
export function applyDismiss(
  state: ReminderState,
  todayKey: string,
  slot: ReminderSlot
): ReminderState {
  const dismissed = state.dismissedSlots || [];
  const key = `${todayKey}:${slot}`;
  const nextDismissed = dismissed.includes(key) ? dismissed : [...dismissed, key];

  return {
    ...state,
    snoozeCount: 0,
    snoozeUntil: null,
    dismissedSlots: nextDismissed,
  };
}

/**
 * Records a slot as successfully fired.
 */
export function recordSlotFired(
  state: ReminderState,
  todayKey: string,
  slot: ReminderSlot,
  isMissedNudge: boolean = false
): ReminderState {
  return {
    ...state,
    lastFiredSlot: slot,
    lastFiredDate: todayKey,
    snoozeUntil: null,
    missedNudgeFiredForDate: isMissedNudge ? todayKey : state.missedNudgeFiredForDate,
  };
}
