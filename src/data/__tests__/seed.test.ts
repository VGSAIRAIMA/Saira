import { describe, it, expect } from 'vitest';
import rawSheet from '../sheet.seed.json';
import {
  sheetSeed,
  allPhases,
  allTopics,
  allSubtopics,
  allPracticeItems,
  getAllTrackableItemIds,
  getItemMeta,
} from '@/lib/seed';

describe('Seed Data Integrity and Counts', () => {
  it('loads seed with exact counts (6 phases, 43 topics, 262 subtopics, 119 practice)', () => {
    expect(allPhases).toHaveLength(6);
    expect(allTopics).toHaveLength(43);
    expect(allSubtopics).toHaveLength(262);
    expect(allPracticeItems).toHaveLength(119);

    const totalTrackable = allSubtopics.length + allPracticeItems.length;
    expect(totalTrackable).toBe(381);
    expect(getAllTrackableItemIds()).toHaveLength(381);
  });

  it('guarantees all 430 IDs in the seed are globally unique and stable', () => {
    const allIds: string[] = [];

    rawSheet.phases.forEach((p) => {
      allIds.push(p.id);
      p.topics.forEach((t) => {
        allIds.push(t.id);
        (t.subtopics || []).forEach((s) => allIds.push(s.id));
        (t.practice || []).forEach((pr) => allIds.push(pr.id));
      });
    });

    expect(allIds).toHaveLength(430);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(430);
  });

  it('verifies that all practice items are honest candidates with verified:false and link:null', () => {
    allPracticeItems.forEach((item) => {
      expect(item.verified).toBe(false);
      expect(item.link).toBeNull();
      expect(item.title).toBeTruthy();
    });
  });

  it('ensures all source tags are only valid domain tags (K, S, +)', () => {
    const validTags = new Set(['K', 'S', '+']);

    allTopics.forEach((t) => {
      t.sources.forEach((src) => {
        expect(validTags.has(src)).toBe(true);
      });
    });

    allSubtopics.forEach((s) => {
      s.sources.forEach((src) => {
        expect(validTags.has(src)).toBe(true);
      });
    });
  });

  it('ensures getItemMeta provides complete phase and topic context for all items', () => {
    allSubtopics.forEach((s) => {
      const meta = getItemMeta(s.id);
      expect(meta).toBeDefined();
      expect(meta?.kind).toBe('subtopic');
      expect(meta?.phase).toBeDefined();
      expect(meta?.topic).toBeDefined();
    });

    allPracticeItems.forEach((pr) => {
      const meta = getItemMeta(pr.id);
      expect(meta).toBeDefined();
      expect(meta?.kind).toBe('practice');
      expect(meta?.phase).toBeDefined();
      expect(meta?.topic).toBeDefined();
    });
  });

  it('has valid verification metadata matching Striver live sections', () => {
    expect(sheetSeed.verification.strivertotal).toBe(495);
    expect(sheetSeed.verification.striverSectionCountsFromLivePage).toHaveLength(20);
  });
});
