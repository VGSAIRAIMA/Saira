import { describe, it, expect, beforeEach } from 'vitest';
import { useSheetStore } from '../useSheetStore';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';

describe('useSheetStore and Atomic DayLog Updates', () => {
  beforeEach(async () => {
    // Reset store state before each test
    useSheetStore.setState({
      isLoaded: true,
      progress: {},
      customItems: [],
      dayLogs: {},
      hiddenIds: new Set(),
      lastTouchedId: null,
      selectedPhaseId: 'p0',
      selectedItemId: null,
      countMode: 'all',
      undoToast: null,
    });
  });

  it('atomically marks an item done and increments today DayLog completed count', async () => {
    const store = useSheetStore.getState();
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const itemId = 'p0-git-and-github.1';

    await store.toggleItemDone(itemId, 'Git item');

    const updated = useSheetStore.getState();
    expect(updated.progress[itemId]?.status).toBe('done');
    expect(updated.progress[itemId]?.completedAt).toBeTruthy();
    expect(updated.dayLogs[todayKey]?.completed).toBe(1);
    expect(updated.lastTouchedId).toBe(itemId);
    expect(updated.undoToast?.itemId).toBe(itemId);
  });

  it('atomically decrements today DayLog when an item is unticked on the same day', async () => {
    const store = useSheetStore.getState();
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const itemId = 'p0-git-and-github.1';

    // Mark done
    await store.toggleItemDone(itemId, 'Git item');
    expect(useSheetStore.getState().dayLogs[todayKey]?.completed).toBe(1);

    // Untick
    await store.toggleItemDone(itemId, 'Git item');
    const updated = useSheetStore.getState();
    expect(updated.progress[itemId]?.status).toBe('not_started');
    expect(updated.dayLogs[todayKey]?.completed).toBe(0);
  });

  it('supports undoing the last tick via undoLastTick()', async () => {
    const store = useSheetStore.getState();
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
    const itemId = 'p0-git-and-github.1';

    await store.toggleItemDone(itemId, 'Git item');
    expect(useSheetStore.getState().progress[itemId]?.status).toBe('done');

    await useSheetStore.getState().undoLastTick();
    expect(useSheetStore.getState().progress[itemId]?.status).toBe('not_started');
    expect(useSheetStore.getState().dayLogs[todayKey]?.completed).toBe(0);
    expect(useSheetStore.getState().undoToast).toBeNull();
  });

  it('preserves notes and metadata when toggling status back and forth', async () => {
    const store = useSheetStore.getState();
    const itemId = 'p0-git-and-github.1';

    await store.updateItemProgress(itemId, {
      notes: 'Crucial note about git rebase',
      confidence: 4,
      keyIdea: 'Fast-forward commit',
    });

    await store.toggleItemDone(itemId);
    expect(useSheetStore.getState().progress[itemId]?.status).toBe('done');
    expect(useSheetStore.getState().progress[itemId]?.notes).toBe('Crucial note about git rebase');

    await store.toggleItemDone(itemId);
    expect(useSheetStore.getState().progress[itemId]?.status).toBe('not_started');
    expect(useSheetStore.getState().progress[itemId]?.notes).toBe('Crucial note about git rebase');
    expect(useSheetStore.getState().progress[itemId]?.confidence).toBe(4);
  });

  it('adds custom items and includes them in store', async () => {
    const store = useSheetStore.getState();
    await store.addCustomItem({
      kind: 'practice',
      topicId: 'p0-git-and-github',
      phaseId: 'p0',
      title: 'Practice cherry-pick conflict',
    });

    const custom = useSheetStore.getState().customItems;
    expect(custom).toHaveLength(1);
    expect(custom[0].title).toBe('Practice cherry-pick conflict');
    expect(custom[0].sources).toEqual(['+']);
  });

  it('hides and unhides items properly', async () => {
    const store = useSheetStore.getState();
    const itemId = 'p0-git-and-github.1';

    await store.toggleHideItem(itemId);
    expect(useSheetStore.getState().hiddenIds.has(itemId)).toBe(true);

    await store.toggleHideItem(itemId);
    expect(useSheetStore.getState().hiddenIds.has(itemId)).toBe(false);
  });
});
