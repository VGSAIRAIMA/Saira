import { describe, it, expect } from 'vitest';
import rawSheet from '../sheet.seed.json';
import { calculatePhaseCompletion } from '@/lib/stats/completion';
import { allPhases } from '@/lib/seed';
import { ItemProgress } from '@/types/sheet';

describe('Manual Count and Percentage Accuracy Over Seed', () => {
  it('matches exact manual item count for each of the 6 phases', () => {
    // Manual independent recount directly from raw JSON
    const manualPhaseTotals = rawSheet.phases.map((phase) => {
      let subtopics = 0;
      let practice = 0;
      phase.topics.forEach((topic) => {
        subtopics += (topic.subtopics || []).length;
        practice += (topic.practice || []).length;
      });
      return {
        id: phase.id,
        order: phase.order,
        subtopics,
        practice,
        total: subtopics + practice,
      };
    });

    // Verify all 6 phases
    expect(manualPhaseTotals).toHaveLength(6);

    const totalSubtopics = manualPhaseTotals.reduce((acc, p) => acc + p.subtopics, 0);
    const totalPractice = manualPhaseTotals.reduce((acc, p) => acc + p.practice, 0);
    const grandTotal = totalSubtopics + totalPractice;

    expect(totalSubtopics).toBe(262);
    expect(totalPractice).toBe(119);
    expect(grandTotal).toBe(381);

    // Verify against our stats function on all phases
    allPhases.forEach((phase, idx) => {
      const statsAll = calculatePhaseCompletion(phase, {}, new Set(), 'all');
      expect(statsAll.total).toBe(manualPhaseTotals[idx].total);

      const statsSub = calculatePhaseCompletion(phase, {}, new Set(), 'subtopics_only');
      expect(statsSub.total).toBe(manualPhaseTotals[idx].subtopics);

      const statsPrac = calculatePhaseCompletion(phase, {}, new Set(), 'practice_only');
      expect(statsPrac.total).toBe(manualPhaseTotals[idx].practice);
    });
  });

  it('matches manual percentage calculation when items are marked done', () => {
    const phase0 = allPhases[0];
    const totalP0 = phase0.topics.reduce(
      (sum, t) => sum + t.subtopics.length + t.practice.length,
      0
    );

    // Mark exactly 7 items done in Phase 0
    const progress: Record<string, ItemProgress> = {};
    let marked = 0;
    for (const t of phase0.topics) {
      for (const s of t.subtopics) {
        if (marked < 7) {
          progress[s.id] = { status: 'done', updatedAt: Date.now() };
          marked++;
        }
      }
    }

    const manualPercentage = Math.round((7 / totalP0) * 1000) / 10;
    const computed = calculatePhaseCompletion(phase0, progress);

    expect(computed.completed).toBe(7);
    expect(computed.total).toBe(totalP0);
    expect(computed.percentage).toBe(manualPercentage);
  });

  it('accurately recalculates percentage when items are hidden', () => {
    const phase1 = allPhases[1];
    const totalP1 = phase1.topics.reduce(
      (sum, t) => sum + t.subtopics.length + t.practice.length,
      0
    );

    // Hide 3 items
    const hiddenSet = new Set<string>();
    let hiddenCount = 0;
    for (const t of phase1.topics) {
      for (const s of t.subtopics) {
        if (hiddenCount < 3) {
          hiddenSet.add(s.id);
          hiddenCount++;
        }
      }
    }

    // Mark 4 non-hidden items done
    const progress: Record<string, ItemProgress> = {};
    let marked = 0;
    for (const t of phase1.topics) {
      for (const s of t.subtopics) {
        if (!hiddenSet.has(s.id) && marked < 4) {
          progress[s.id] = { status: 'done', updatedAt: Date.now() };
          marked++;
        }
      }
    }

    const expectedTotal = totalP1 - 3;
    const expectedPercentage = Math.round((4 / expectedTotal) * 1000) / 10;

    const computed = calculatePhaseCompletion(phase1, progress, hiddenSet);
    expect(computed.total).toBe(expectedTotal);
    expect(computed.completed).toBe(4);
    expect(computed.hiddenCount).toBe(3);
    expect(computed.percentage).toBe(expectedPercentage);
  });

  it('guarantees practice candidates have no official links and are verified:false', () => {
    rawSheet.phases.forEach((phase) => {
      phase.topics.forEach((topic) => {
        (topic.practice || []).forEach((p) => {
          expect(p.verified).toBe(false);
          expect(p.link).toBeNull();
        });
      });
    });
  });
});
