import { describe, it, expect } from 'vitest';
import {
  calculateItemsCompletion,
  calculateTopicCompletion,
  calculatePhaseCompletion,
  calculateOverallCompletion,
} from '../completion';
import { allPhases, allTopics } from '@/lib/seed';
import { ItemProgress } from '@/types/sheet';

describe('Completion Statistics Calculations', () => {
  it('returns 0% and 381 total items when progress is empty', () => {
    const result = calculateOverallCompletion(allPhases, {});
    expect(result.total).toBe(381);
    expect(result.completed).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.hiddenCount).toBe(0);
  });

  it('respects count modes: all, subtopics_only, practice_only', () => {
    const allResult = calculateOverallCompletion(allPhases, {}, new Set(), 'all');
    expect(allResult.total).toBe(381);

    const subtopicsResult = calculateOverallCompletion(allPhases, {}, new Set(), 'subtopics_only');
    expect(subtopicsResult.total).toBe(262);

    const practiceResult = calculateOverallCompletion(allPhases, {}, new Set(), 'practice_only');
    expect(practiceResult.total).toBe(119);
  });

  it('calculates topic completion accurately and handles status:done correctly', () => {
    const topic = allTopics[0]; // p0-git-and-github has 8 subtopics and 0 practice
    const subtopic1Id = topic.subtopics[0].id;
    const subtopic2Id = topic.subtopics[1].id;

    const progress: Record<string, ItemProgress> = {
      [subtopic1Id]: { status: 'done', updatedAt: Date.now() },
      [subtopic2Id]: { status: 'in_progress', updatedAt: Date.now() },
    };

    const res = calculateTopicCompletion(topic, progress);
    expect(res.total).toBe(8);
    expect(res.completed).toBe(1); // Only status === 'done' counts as completed
    expect(res.percentage).toBe(12.5); // (1 / 8) * 100 = 12.5%
  });

  it('excludes hidden items from total denominator and tracks hiddenCount', () => {
    const topic = allTopics[0]; // 8 subtopics
    const subtopic1Id = topic.subtopics[0].id;
    const subtopic2Id = topic.subtopics[1].id;

    const progress: Record<string, ItemProgress> = {
      [subtopic1Id]: { status: 'done', updatedAt: Date.now() },
      [subtopic2Id]: { status: 'not_started', hidden: true, updatedAt: Date.now() },
    };

    // subtopic2 is hidden via progress.hidden
    const res = calculateTopicCompletion(topic, progress);
    expect(res.total).toBe(7); // 8 - 1 = 7
    expect(res.completed).toBe(1);
    expect(res.hiddenCount).toBe(1);
    expect(res.percentage).toBe(14.3); // Math.round((1 / 7) * 1000) / 10 = 14.3%
  });

  it('calculates phase completion correctly across multiple topics', () => {
    const phase0 = allPhases[0];
    const totalItemsInPhase0 = phase0.topics.reduce(
      (sum, t) => sum + t.subtopics.length + t.practice.length,
      0
    );

    // Mark 10 items done in Phase 0
    const progress: Record<string, ItemProgress> = {};
    let marked = 0;
    for (const t of phase0.topics) {
      for (const s of t.subtopics) {
        if (marked < 10) {
          progress[s.id] = { status: 'done', updatedAt: Date.now() };
          marked++;
        }
      }
    }

    const res = calculatePhaseCompletion(phase0, progress);
    expect(res.total).toBe(totalItemsInPhase0);
    expect(res.completed).toBe(10);
    const expectedPercentage = Math.round((10 / totalItemsInPhase0) * 1000) / 10;
    expect(res.percentage).toBe(expectedPercentage);
  });

  it('handles empty item lists cleanly without dividing by zero', () => {
    const res = calculateItemsCompletion([]);
    expect(res.total).toBe(0);
    expect(res.completed).toBe(0);
    expect(res.percentage).toBe(0);
    expect(res.hiddenCount).toBe(0);
  });
});
