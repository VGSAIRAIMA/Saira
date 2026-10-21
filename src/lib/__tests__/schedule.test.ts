import { describe, it, expect } from 'vitest';
import {
  evaluateSchedule,
  applySnooze,
  applyDismiss,
  recordSlotFired,
  parseTimeToMinutes,
  getDateMinutesInTz,
  getDayOfWeekInTz,
} from '@/lib/schedule';
import { DEFAULT_REMINDER_SETTINGS, DEFAULT_REMINDER_STATE } from '@/lib/reminderStorage';
import { ReminderSettings, ReminderState, DayLog } from '@/types/sheet';
import { DEFAULT_TIMEZONE } from '@/lib/time';

describe('Scheduler and Reminder Logic (Fake Clock Tests)', () => {
  const baseSettings: ReminderSettings = {
    ...DEFAULT_REMINDER_SETTINGS,
    morningTime: '08:30',
    studyTime: '19:00',
    snoozeMinutes: 15,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    quietHoursEnabled: false,
  };

  const emptyLogs: Record<string, DayLog> = {};
  const activeYesterdayLogs: Record<string, DayLog> = {
    '2026-10-20': {
      dayKey: '2026-10-20',
      completed: 2,
      revised: 0,
      minutes: 20,
      restDay: false,
    },
  };

  describe('Time Parsing & Timezone Helpers', () => {
    it('parses HH:mm strings into minutes', () => {
      expect(parseTimeToMinutes('08:30')).toBe(510);
      expect(parseTimeToMinutes('19:00')).toBe(1140);
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('extracts correct minutes in Asia/Kolkata (UTC+5:30)', () => {
      // 08:30 IST is 03:00 UTC
      const d830 = new Date('2026-10-21T03:00:00.000Z');
      expect(getDateMinutesInTz(d830, DEFAULT_TIMEZONE)).toBe(510);

      // 19:00 IST is 13:30 UTC
      const d1900 = new Date('2026-10-21T13:30:00.000Z');
      expect(getDateMinutesInTz(d1900, DEFAULT_TIMEZONE)).toBe(1140);
    });

    it('extracts correct day of week in Asia/Kolkata', () => {
      // 2026-10-21 is a Wednesday (3)
      const d = new Date('2026-10-21T03:00:00.000Z');
      expect(getDayOfWeekInTz(d, DEFAULT_TIMEZONE)).toBe(3);
    });
  });

  describe('Slot Firing at 08:30 and 19:00', () => {
    it('fires morning slot at exactly 08:30', () => {
      // 2026-10-21 08:30 IST = 2026-10-21T03:00:00.000Z
      const fakeClock = new Date('2026-10-21T03:00:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('morning');
      expect(result.lineCategory).toBe('morning');
    });

    it('fires morning slot if within the 30-minute late window (e.g. 08:45)', () => {
      // 2026-10-21 08:45 IST = 2026-10-21T03:15:00.000Z
      const fakeClock = new Date('2026-10-21T03:15:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('morning');
    });

    it('does NOT fire morning slot if past 30-minute late window (e.g. 09:05)', () => {
      // 2026-10-21 09:05 IST = 2026-10-21T03:35:00.000Z (35 min after 08:30)
      const fakeClock = new Date('2026-10-21T03:35:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('wait');
    });

    it('fires study slot at exactly 19:00', () => {
      // 2026-10-21 19:00 IST = 2026-10-21T13:30:00.000Z
      const fakeClock = new Date('2026-10-21T13:30:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('study');
      expect(result.lineCategory).toBe('study');
    });

    it('fires study slot if within 30-minute late window (e.g. 19:20)', () => {
      // 2026-10-21 19:20 IST = 2026-10-21T13:50:00.000Z
      const fakeClock = new Date('2026-10-21T13:50:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('study');
    });

    it('does NOT fire study slot if past 30-minute late window (e.g. 19:35)', () => {
      // 2026-10-21 19:35 IST = 2026-10-21T14:05:00.000Z (35 min after 19:00)
      const fakeClock = new Date('2026-10-21T14:05:00.000Z');

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('wait');
    });
  });

  describe('Snooze Logic (Max 3 Snoozes)', () => {
    const fakeTimeMs = new Date('2026-10-21T03:00:00.000Z').getTime();

    it('allows up to 3 snoozes with 15-minute increments', () => {
      let state: ReminderState = { ...DEFAULT_REMINDER_STATE, lastFiredSlot: 'morning' };

      // Snooze 1
      const res1 = applySnooze(state, 15, fakeTimeMs);
      expect(res1.success).toBe(true);
      expect(res1.state.snoozeCount).toBe(1);
      expect(res1.state.snoozeUntil).toBe(fakeTimeMs + 15 * 60 * 1000);
      state = res1.state;

      // Snooze 2
      const res2 = applySnooze(state, 15, fakeTimeMs + 15 * 60 * 1000);
      expect(res2.success).toBe(true);
      expect(res2.state.snoozeCount).toBe(2);
      state = res2.state;

      // Snooze 3
      const res3 = applySnooze(state, 15, fakeTimeMs + 30 * 60 * 1000);
      expect(res3.success).toBe(true);
      expect(res3.state.snoozeCount).toBe(3);
      state = res3.state;

      // Snooze 4 (must be rejected)
      const res4 = applySnooze(state, 15, fakeTimeMs + 45 * 60 * 1000);
      expect(res4.success).toBe(false);
      expect(res4.reason).toBe('max_snoozes_reached');
      expect(res4.state.snoozeCount).toBe(3);
    });

    it('waits while snooze is pending, then fires when snooze time arrives', () => {
      const snoozeUntil = fakeTimeMs + 15 * 60 * 1000;
      const snoozedState: ReminderState = {
        ...DEFAULT_REMINDER_STATE,
        snoozeCount: 1,
        snoozeUntil,
        lastFiredSlot: 'morning',
      };

      // 5 minutes before snooze expires
      const pendingClock = new Date(fakeTimeMs + 10 * 60 * 1000);
      const pendingResult = evaluateSchedule({
        currentTime: pendingClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: snoozedState,
      });
      expect(pendingResult.action).toBe('wait');
      expect(pendingResult.reason).toBe('snooze_pending');

      // Exactly when snooze expires
      const dueClock = new Date(snoozeUntil);
      const dueResult = evaluateSchedule({
        currentTime: dueClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: snoozedState,
      });
      expect(dueResult.action).toBe('fire');
      expect(dueResult.reason).toBe('snooze_due');
      expect(dueResult.slot).toBe('morning');
    });
  });

  describe('Not Today / Dismiss Logic', () => {
    it('records dismissal for the slot and suppresses further prompts for that date', () => {
      const dismissedState = applyDismiss(DEFAULT_REMINDER_STATE, '2026-10-21', 'morning');
      expect(dismissedState.dismissedSlots).toContain('2026-10-21:morning');
      expect(dismissedState.snoozeCount).toBe(0);
      expect(dismissedState.snoozeUntil).toBeNull();

      // At 08:30 on 2026-10-21, should NOT fire morning slot because it was dismissed
      const fakeClock = new Date('2026-10-21T03:00:00.000Z');
      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: activeYesterdayLogs,
        reminderState: dismissedState,
      });

      expect(result.action).toBe('wait');
    });
  });

  describe('Goal Already Met Check', () => {
    it('skips slot firing if today target is already met', () => {
      const fakeClock = new Date('2026-10-21T03:00:00.000Z'); // 08:30 IST
      const metGoalLogs: Record<string, DayLog> = {
        '2026-10-21': {
          dayKey: '2026-10-21',
          completed: 2,
          revised: 0,
          minutes: 20,
          restDay: false,
        },
      };

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: metGoalLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('skip');
      expect(result.reason).toBe('goal_already_met');
    });
  });

  describe('Missed Day Nudge Logic', () => {
    it('fires nudge_missed at the next evening slot after a missed day', () => {
      // 2026-10-21 19:00 IST = 2026-10-21T13:30:00.000Z
      const fakeClock = new Date('2026-10-21T13:30:00.000Z');

      // Yesterday (2026-10-20) had 0 completed items and was not a rest day
      const missedYesterdayLogs: Record<string, DayLog> = {
        '2026-10-20': {
          dayKey: '2026-10-20',
          completed: 0,
          revised: 0,
          minutes: 0,
          restDay: false,
        },
      };

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: missedYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('study');
      expect(result.lineCategory).toBe('nudge_missed');
    });

    it('fires nudge_missed ONLY ONCE per date', () => {
      const fakeClock = new Date('2026-10-21T13:30:00.000Z');
      const missedYesterdayLogs: Record<string, DayLog> = {
        '2026-10-20': {
          dayKey: '2026-10-20',
          completed: 0,
          revised: 0,
          minutes: 0,
          restDay: false,
        },
      };

      // Fired once and recorded with isMissedNudge: true
      const recordedState = recordSlotFired(DEFAULT_REMINDER_STATE, '2026-10-21', 'study', true);
      expect(recordedState.missedNudgeFiredForDate).toBe('2026-10-21');

      // Subsequent evaluation on same date with reset lastFiredSlot (e.g. edge case or snooze)
      const stateWithMissedRecorded: ReminderState = {
        ...DEFAULT_REMINDER_STATE,
        missedNudgeFiredForDate: '2026-10-21',
      };

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: missedYesterdayLogs,
        reminderState: stateWithMissedRecorded,
      });

      // Does not use nudge_missed again, falls back to regular study line
      expect(result.action).toBe('fire');
      expect(result.slot).toBe('study');
      expect(result.lineCategory).toBe('study');
    });

    it('does NOT fire nudge_missed if yesterday was a designated rest day', () => {
      const fakeClock = new Date('2026-10-21T13:30:00.000Z');
      const restDayYesterdayLogs: Record<string, DayLog> = {
        '2026-10-20': {
          dayKey: '2026-10-20',
          completed: 0,
          revised: 0,
          minutes: 0,
          restDay: true, // Marked as rest day
        },
      };

      const result = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: restDayYesterdayLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });

      expect(result.action).toBe('fire');
      expect(result.slot).toBe('study');
      expect(result.lineCategory).toBe('study'); // Normal study line, not a missed nudge!
    });
  });

  describe('Two-Tab Deduplication', () => {
    it('prevents duplicate firing across two tabs when Tab A has already fired the slot', () => {
      const fakeClock = new Date('2026-10-21T03:00:00.000Z'); // 08:30 IST

      // Tab A evaluates and fires
      const tabAResult = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: emptyLogs,
        reminderState: DEFAULT_REMINDER_STATE,
      });
      expect(tabAResult.action).toBe('fire');
      expect(tabAResult.slot).toBe('morning');

      // Tab A records slot fired to state (which gets persisted to storage & Firestore)
      const updatedState = recordSlotFired(DEFAULT_REMINDER_STATE, '2026-10-21', 'morning');

      // Tab B receives or reads this updated state
      const tabBResult = evaluateSchedule({
        currentTime: fakeClock,
        settings: baseSettings,
        dailyTarget: 2,
        dayLogs: emptyLogs,
        reminderState: updatedState,
      });

      // Tab B must NOT fire again!
      expect(tabBResult.action).toBe('wait');
      expect(tabBResult.slot).toBeUndefined();
    });
  });
});
