import { describe, it, expect } from 'vitest';
import { mergeLocalAndCloudData, toTimestampMs } from '../sync';
import { ItemProgress, DayLog, CustomItem } from '@/types/sheet';

describe('Firebase First Sign-in Merge Logic', () => {
  it('correctly parses various timestamp formats into milliseconds', () => {
    const epoch = 1729420000000;
    expect(toTimestampMs(epoch)).toBe(epoch);
    expect(toTimestampMs(new Date(epoch).toISOString())).toBe(epoch);
    expect(toTimestampMs({ toMillis: () => epoch })).toBe(epoch);
    expect(toTimestampMs(null)).toBe(0);
    expect(toTimestampMs(undefined)).toBe(0);
  });

  it('keeps local-only progress and marks it for upload to cloud', () => {
    const localItem: ItemProgress = {
      status: 'done',
      completedAt: '2026-10-20T08:00:00Z',
      lastTouchedAt: '2026-10-20T08:00:00Z',
      updatedAt: 1000,
    };

    const { merged, itemsToUpload } = mergeLocalAndCloudData(
      { progress: { 'item-1': localItem }, customItems: [], dayLogs: {}, hiddenIds: [] },
      { progress: {}, customItems: [], dayLogs: {}, hiddenIds: [] }
    );

    expect(merged.progress['item-1']).toEqual(localItem);
    expect(itemsToUpload.progress['item-1']).toEqual(localItem);
  });

  it('pulls cloud-only progress into merged data without re-uploading', () => {
    const cloudItem: ItemProgress = {
      status: 'done',
      completedAt: '2026-10-19T08:00:00Z',
      lastTouchedAt: '2026-10-19T08:00:00Z',
      updatedAt: 2000,
    };

    const { merged, itemsToUpload } = mergeLocalAndCloudData(
      { progress: {}, customItems: [], dayLogs: {}, hiddenIds: [] },
      { progress: { 'item-cloud': cloudItem }, customItems: [], dayLogs: {}, hiddenIds: [] }
    );

    expect(merged.progress['item-cloud']).toEqual(cloudItem);
    expect(itemsToUpload.progress['item-cloud']).toBeUndefined();
  });

  it('resolves conflicting items using newer updatedAt', () => {
    const olderLocal: ItemProgress = {
      status: 'in_progress',
      notes: 'Old note',
      updatedAt: 1000,
      lastTouchedAt: 1000,
    };
    const newerCloud: ItemProgress = {
      status: 'done',
      notes: 'Newer cloud note',
      updatedAt: 2000,
      lastTouchedAt: 2000,
    };

    // Case 1: Cloud is newer
    const res1 = mergeLocalAndCloudData(
      { progress: { 'item-1': olderLocal }, customItems: [], dayLogs: {}, hiddenIds: [] },
      { progress: { 'item-1': newerCloud }, customItems: [], dayLogs: {}, hiddenIds: [] }
    );
    expect(res1.merged.progress['item-1'].status).toBe('done');
    expect(res1.merged.progress['item-1'].notes).toBe('Newer cloud note');
    expect(res1.itemsToUpload.progress['item-1']).toBeUndefined();

    // Case 2: Local is newer
    const newerLocal: ItemProgress = {
      status: 'needs_revision',
      notes: 'Brand new local note',
      updatedAt: 3000,
      lastTouchedAt: 3000,
    };
    const res2 = mergeLocalAndCloudData(
      { progress: { 'item-1': newerLocal }, customItems: [], dayLogs: {}, hiddenIds: [] },
      { progress: { 'item-1': newerCloud }, customItems: [], dayLogs: {}, hiddenIds: [] }
    );
    expect(res2.merged.progress['item-1'].status).toBe('needs_revision');
    expect(res2.merged.progress['item-1'].notes).toBe('Brand new local note');
    expect(res2.itemsToUpload.progress['item-1']).toEqual(newerLocal);
  });

  it('merges DayLogs non-destructively using maximum values to protect study effort', () => {
    const localDay: DayLog = {
      dayKey: '2026-10-20',
      completed: 3,
      revised: 1,
      minutes: 45,
      restDay: false,
    };
    const cloudDay: DayLog = {
      dayKey: '2026-10-20',
      completed: 2,
      revised: 2,
      minutes: 30,
      restDay: true,
    };

    const { merged } = mergeLocalAndCloudData(
      { progress: {}, customItems: [], dayLogs: { '2026-10-20': localDay }, hiddenIds: [] },
      { progress: {}, customItems: [], dayLogs: { '2026-10-20': cloudDay }, hiddenIds: [] }
    );

    const resultDay = merged.dayLogs['2026-10-20'];
    expect(resultDay.completed).toBe(3); // max(3, 2)
    expect(resultDay.revised).toBe(2);   // max(1, 2)
    expect(resultDay.minutes).toBe(45);  // max(45, 30)
    expect(resultDay.restDay).toBe(true); // false || true
  });

  it('unions custom items and hidden items without duplicate entries', () => {
    const localCustom: CustomItem = {
      id: 'custom-1',
      kind: 'practice',
      topicId: 'p0-git',
      phaseId: 'p0',
      title: 'Local Custom',
      order: 1,
      createdAt: 100,
    };
    const cloudCustom: CustomItem = {
      id: 'custom-2',
      kind: 'subtopic',
      topicId: 'p0-git',
      phaseId: 'p0',
      title: 'Cloud Custom',
      order: 2,
      createdAt: 200,
    };

    const { merged } = mergeLocalAndCloudData(
      { progress: {}, customItems: [localCustom], dayLogs: {}, hiddenIds: ['hid-1'] },
      { progress: {}, customItems: [cloudCustom], dayLogs: {}, hiddenIds: ['hid-1', 'hid-2'] }
    );

    expect(merged.customItems).toHaveLength(2);
    expect(merged.hiddenIds).toEqual(['hid-1', 'hid-2']);
  });
});
