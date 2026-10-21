import { describe, it, expect, beforeEach } from 'vitest';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDailyQuote, getMilestoneQuote } from '@/lib/quotes';
import { getDayKey, DEFAULT_TIMEZONE, addDaysToDayKey } from '@/lib/time';
import {
  calculateStreak,
  calculatePace,
  calculateProjectedFinish,
  calculateConsistency30,
  calculateOverallCompletion,
  calculatePhaseCompletion,
} from '@/lib/stats';
import { allPhases } from '@/lib/seed';

describe('Milestone 3 Integration & Acceptance', () => {
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

  beforeEach(() => {
    // Reset store state
    useSheetStore.setState({
      progress: {},
      dayLogs: {},
      hiddenIds: new Set(),
      dailyTarget: 3,
      favoriteQuoteIds: new Set(),
    });
  });

  describe('Daily Quotes Engine', () => {
    it('returns a stable, deterministic quote for the same calendar dayKey', () => {
      const quote1 = getDailyQuote('2026-10-20');
      const quote2 = getDailyQuote('2026-10-20');
      expect(quote1.id).toBe(quote2.id);
      expect(quote1.text).toBe(quote2.text);
      expect(quote1.cat).toBe(quote2.cat);
    });

    it('returns different quotes for different calendar days', () => {
      const qA = getDailyQuote('2026-10-20');
      const qB = getDailyQuote('2026-10-21');
      // While hash collisions are theoretically possible, adjacent dates should differ
      expect(qA.id).not.toBe(qB.id);
    });

    it('in-session shift rotates cleanly without altering dayKey base calculation', () => {
      const baseQuote = getDailyQuote('2026-10-20', 0);
      const nextQuote = getDailyQuote('2026-10-20', 1);
      expect(baseQuote.id).not.toBe(nextQuote.id);

      // Re-fetching shift 0 returns the original stable quote
      const stableCheck = getDailyQuote('2026-10-20', 0);
      expect(stableCheck.id).toBe(baseQuote.id);
    });

    it('returns valid milestone quotes', () => {
      const m1 = getMilestoneQuote(7);
      const m2 = getMilestoneQuote(30);
      expect(m1.text).toBeTruthy();
      expect(m2.text).toBeTruthy();
      expect(m1.cat).toBe('milestone');
    });
  });

  describe('Session State: Ticking an item updates Today, Streak, Heatmap, and Progress', () => {
    it('ticking an item writes dayLog and immediately reflects in pure stats calculations', async () => {
      const firstPhase = allPhases[0];
      const firstTopic = firstPhase.topics[0];
      const firstSubtopic = firstTopic.subtopics[0];

      // Initial state: 0 completion, 0 streak, 0 pace
      const initialCompletion = calculateOverallCompletion(allPhases, {}, new Set());
      expect(initialCompletion.completed).toBe(0);
      expect(initialCompletion.percentage).toBe(0);

      const initialStreak = calculateStreak({});
      expect(initialStreak.currentStreak).toBe(0);

      const initialPace = calculatePace({}, todayKey, 14);
      expect(initialPace).toBe(0);

      const initialProjected = calculateProjectedFinish(todayKey, initialCompletion.total, initialPace);
      expect(initialProjected).toBeNull(); // Honest empty state

      // Tick the first item
      await useSheetStore.getState().toggleItemDone(firstSubtopic.id);

      const stateAfter = useSheetStore.getState();

      // 1. Verify item marked done
      expect(stateAfter.progress[firstSubtopic.id]?.status).toBe('done');

      // 2. Verify DayLog was recorded for todayKey
      const todayLog = stateAfter.dayLogs[todayKey];
      expect(todayLog).toBeDefined();
      expect(todayLog?.completed).toBe(1);

      // 3. Stats immediately reflect change
      const completionAfter = calculateOverallCompletion(allPhases, stateAfter.progress, stateAfter.hiddenIds);
      expect(completionAfter.completed).toBe(1);
      expect(completionAfter.percentage).toBeGreaterThan(0);

      const phaseCompletionAfter = calculatePhaseCompletion(firstPhase, stateAfter.progress, stateAfter.hiddenIds);
      expect(phaseCompletionAfter.completed).toBe(1);

      const streakAfter = calculateStreak(stateAfter.dayLogs, todayKey);
      expect(streakAfter.currentStreak).toBe(1);

      const paceAfter = calculatePace(stateAfter.dayLogs, todayKey, 14);
      expect(paceAfter).toBe(1);

      const remaining = completionAfter.total - completionAfter.completed;
      const projectedAfter = calculateProjectedFinish(todayKey, remaining, paceAfter);
      expect(projectedAfter).toBe(addDaysToDayKey(todayKey, remaining));

      const consistencyAfter = calculateConsistency30(stateAfter.dayLogs, todayKey);
      expect(consistencyAfter).toBe(Math.round((1 / 30) * 1000) / 1000);
    });
  });

  describe('Daily Target and Favorite Quotes in Store', () => {
    it('updates daily target properly', async () => {
      expect(useSheetStore.getState().dailyTarget).toBe(3);
      await useSheetStore.getState().setDailyTarget(5);
      expect(useSheetStore.getState().dailyTarget).toBe(5);
    });

    it('toggles quote favorites', async () => {
      expect(useSheetStore.getState().favoriteQuoteIds.has('q001')).toBe(false);
      await useSheetStore.getState().toggleFavoriteQuote('q001');
      expect(useSheetStore.getState().favoriteQuoteIds.has('q001')).toBe(true);
      await useSheetStore.getState().toggleFavoriteQuote('q001');
      expect(useSheetStore.getState().favoriteQuoteIds.has('q001')).toBe(false);
    });
  });
});
