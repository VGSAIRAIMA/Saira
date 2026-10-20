import { create } from 'zustand';
import {
  Status,
  SourceTag,
  ItemProgress,
  CustomItem,
  DayLog,
} from '@/types/sheet';
import { CountMode } from '@/lib/stats/completion';
import { createInitialRevisionState } from '@/lib/stats/revision';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import {
  loadInitialData,
  persistProgressAndDayLog,
  persistCustomItems,
  persistHiddenItems,
  exportBackupJson,
  importBackupJson,
} from '@/lib/storage';
import { allPhases } from '@/lib/seed';
import { auth, db } from '@/lib/firebase';
import {
  toTimestampMs,
  writeItemProgressToCloud,
  writeCustomItemToCloud,
  writeHiddenIdsToCloud,
  syncFirstSignIn,
  SyncStatus,
  UserDataBundle,
} from '@/lib/sync';

export interface SheetFilters {
  status: 'all' | Status;
  source: 'all' | SourceTag;
  bookmarkedOnly: boolean;
  dueRevisionOnly: boolean;
  lowConfidenceOnly: boolean;
  hasNotesOnly: boolean;
}

export interface UndoToastState {
  itemId: string;
  previousStatus: Status;
  title: string;
}

export interface SheetState {
  isLoaded: boolean;
  progress: Record<string, ItemProgress>;
  customItems: CustomItem[];
  dayLogs: Record<string, DayLog>;
  hiddenIds: Set<string>;
  lastTouchedId: string | null;

  selectedPhaseId: string;
  selectedItemId: string | null;
  countMode: CountMode;
  filters: SheetFilters;
  searchQuery: string;
  undoToast: UndoToastState | null;
  syncStatus: SyncStatus;
  syncError: string | null;

  // Actions
  initialize: () => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  setSyncError: (error: string | null) => void;
  retrySync: () => Promise<void>;
  applyCloudSync: (bundle: UserDataBundle) => Promise<void>;
  mergeRemoteProgress: (remoteProgress: Record<string, ItemProgress>) => void;
  mergeRemoteDays: (remoteDays: Record<string, DayLog>) => void;
  mergeRemoteCustom: (remoteCustom: CustomItem[]) => void;
  mergeRemoteHiddenIds: (remoteHiddenIds: string[]) => void;

  setSelectedPhaseId: (phaseId: string) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setCountMode: (mode: CountMode) => void;
  setFilter: <K extends keyof SheetFilters>(key: K, value: SheetFilters[K]) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;


  toggleItemDone: (itemId: string, title?: string) => Promise<void>;
  undoLastTick: () => Promise<void>;
  dismissUndoToast: () => void;

  updateItemProgress: (itemId: string, updates: Partial<ItemProgress>) => Promise<void>;
  toggleBookmark: (itemId: string) => Promise<void>;
  toggleHideItem: (itemId: string) => Promise<void>;
  addCustomItem: (item: {
    kind: 'subtopic' | 'practice';
    topicId: string;
    phaseId: string;
    title: string;
    links?: { video?: string; article?: string; practice?: string };
  }) => Promise<void>;

  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  getContinueItemId: () => string | null;
}

const defaultFilters: SheetFilters = {
  status: 'all',
  source: 'all',
  bookmarkedOnly: false,
  dueRevisionOnly: false,
  lowConfidenceOnly: false,
  hasNotesOnly: false,
};

let undoTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useSheetStore = create<SheetState>((set, get) => ({
  isLoaded: false,
  progress: {},
  customItems: [],
  dayLogs: {},
  hiddenIds: new Set(),
  lastTouchedId: null,

  selectedPhaseId: 'p0',
  selectedItemId: null,
  countMode: 'all',
  filters: defaultFilters,
  searchQuery: '',
  undoToast: null,
  syncStatus: 'local_only',
  syncError: null,

  initialize: async () => {
    if (get().isLoaded) return;
    const initialData = await loadInitialData();
    set({
      progress: initialData.progress,
      customItems: initialData.customItems,
      dayLogs: initialData.dayLogs,
      hiddenIds: initialData.hiddenIds,
      lastTouchedId: initialData.lastTouchedId,
      isLoaded: true,
    });
  },

  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncError: (error) => set({ syncError: error }),

  retrySync: async () => {
    const user = auth?.currentUser;
    if (!user || !db) return;
    set({ syncStatus: 'syncing', syncError: null });
    try {
      const state = get();
      const localBundle: UserDataBundle = {
        progress: state.progress,
        customItems: state.customItems,
        dayLogs: state.dayLogs,
        hiddenIds: Array.from(state.hiddenIds),
      };
      const merged = await syncFirstSignIn(user.uid, localBundle);
      await get().applyCloudSync(merged);
      set({ syncStatus: navigator.onLine ? 'synced' : 'offline', syncError: null });
    } catch (err) {
      console.error('Retry sync failed:', err);
      set({
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : String(err),
      });
    }
  },

  applyCloudSync: async (bundle: UserDataBundle) => {
    const hiddenSet = new Set(bundle.hiddenIds || []);
    set({
      progress: bundle.progress,
      customItems: bundle.customItems,
      dayLogs: bundle.dayLogs,
      hiddenIds: hiddenSet,
    });
    await Promise.all([
      persistProgressAndDayLog(bundle.progress, bundle.dayLogs, get().lastTouchedId || undefined),
      persistCustomItems(bundle.customItems),
      persistHiddenItems(hiddenSet),
    ]);
  },

  mergeRemoteProgress: (remoteProgress: Record<string, ItemProgress>) => {
    const current = get().progress;
    let changed = false;
    const next = { ...current };

    for (const [id, remoteItem] of Object.entries(remoteProgress)) {
      const localItem = current[id];
      if (!localItem) {
        next[id] = remoteItem;
        changed = true;
      } else {
        const localTime = toTimestampMs(localItem.updatedAt || localItem.lastTouchedAt);
        const remoteTime = toTimestampMs(remoteItem.updatedAt || remoteItem.lastTouchedAt);
        if (remoteTime > localTime) {
          next[id] = remoteItem;
          changed = true;
        }
      }
    }

    if (changed) {
      set({ progress: next });
      persistProgressAndDayLog(next, get().dayLogs, get().lastTouchedId || undefined).catch(console.error);
    }
  },

  mergeRemoteDays: (remoteDays: Record<string, DayLog>) => {
    const current = get().dayLogs;
    let changed = false;
    const next = { ...current };

    for (const [dayKey, remoteDay] of Object.entries(remoteDays)) {
      const localDay = current[dayKey];
      if (!localDay) {
        next[dayKey] = remoteDay;
        changed = true;
      } else {
        const mergedDay: DayLog = {
          dayKey,
          completed: Math.max(localDay.completed || 0, remoteDay.completed || 0),
          revised: Math.max(localDay.revised || 0, remoteDay.revised || 0),
          minutes: Math.max(localDay.minutes || 0, remoteDay.minutes || 0),
          restDay: Boolean(localDay.restDay || remoteDay.restDay),
        };
        if (
          mergedDay.completed !== localDay.completed ||
          mergedDay.revised !== localDay.revised ||
          mergedDay.minutes !== localDay.minutes ||
          mergedDay.restDay !== localDay.restDay
        ) {
          next[dayKey] = mergedDay;
          changed = true;
        }
      }
    }

    if (changed) {
      set({ dayLogs: next });
      persistProgressAndDayLog(get().progress, next, get().lastTouchedId || undefined).catch(console.error);
    }
  },

  mergeRemoteCustom: (remoteCustom: CustomItem[]) => {
    const current = get().customItems;
    const currentMap = new Map(current.map((i) => [i.id, i]));
    let changed = false;

    for (const item of remoteCustom) {
      if (!currentMap.has(item.id)) {
        currentMap.set(item.id, item);
        changed = true;
      }
    }

    if (changed) {
      const next = Array.from(currentMap.values());
      set({ customItems: next });
      persistCustomItems(next).catch(console.error);
    }
  },

  mergeRemoteHiddenIds: (remoteHiddenIds: string[]) => {
    const current = get().hiddenIds;
    let changed = false;
    const next = new Set(current);

    for (const id of remoteHiddenIds) {
      if (!next.has(id)) {
        next.add(id);
        changed = true;
      }
    }

    if (changed) {
      set({ hiddenIds: next });
      persistHiddenItems(next).catch(console.error);
    }
  },

  setSelectedPhaseId: (phaseId) => set({ selectedPhaseId: phaseId }),
  setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),
  setCountMode: (mode) => set({ countMode: mode }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultFilters, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleItemDone: async (itemId: string, title: string = '') => {
    const { progress, dayLogs } = get();
    const current = progress[itemId];
    const prevStatus: Status = current?.status || 'not_started';
    const nextStatus: Status = prevStatus === 'done' ? 'not_started' : 'done';

    const now = new Date();
    const nowIso = now.toISOString();
    const todayKey = getDayKey(now, DEFAULT_TIMEZONE);

    // 1. Update item progress
    const updatedItem: ItemProgress = {
      ...(current || { updatedAt: nowIso }),
      status: nextStatus,
      lastTouchedAt: nowIso,
      updatedAt: nowIso,
    };

    if (nextStatus === 'done') {
      updatedItem.completedAt = nowIso;
      updatedItem.revision = createInitialRevisionState(todayKey);
    }

    const updatedProgress = { ...progress, [itemId]: updatedItem };

    // 2. Atomic DayLog update
    const currentDayLog: DayLog = dayLogs[todayKey] || {
      dayKey: todayKey,
      completed: 0,
      revised: 0,
      minutes: 0,
    };

    let updatedDayLog: DayLog;
    if (nextStatus === 'done') {
      updatedDayLog = {
        ...currentDayLog,
        completed: (currentDayLog.completed || 0) + 1,
      };
    } else {
      // If undone on the same day it was finished, decrement completed
      const wasCompletedToday =
        current?.completedAt && current.completedAt.toString().startsWith(todayKey);
      updatedDayLog = {
        ...currentDayLog,
        completed: wasCompletedToday
          ? Math.max(0, (currentDayLog.completed || 0) - 1)
          : currentDayLog.completed || 0,
      };
    }

    const updatedDayLogs = { ...dayLogs, [todayKey]: updatedDayLog };

    // 3. Set undo toast for 6 seconds
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    undoTimeoutId = setTimeout(() => {
      set({ undoToast: null });
    }, 6000);

    set({
      progress: updatedProgress,
      dayLogs: updatedDayLogs,
      lastTouchedId: itemId,
      undoToast: {
        itemId,
        previousStatus: prevStatus,
        title: title || 'Item',
      },
    });

    // 4. Persist atomically to IndexedDB
    await persistProgressAndDayLog(updatedProgress, updatedDayLogs, itemId);

    // 5. Cloud write-through if authenticated
    const user = auth?.currentUser;
    if (user && db) {
      writeItemProgressToCloud(user.uid, itemId, updatedItem, updatedDayLog)
        .then(() => {
          if (get().syncStatus === 'error') {
            set({ syncStatus: 'synced', syncError: null });
          }
        })
        .catch((err) => {
          console.error('Failed to sync item to cloud:', err);
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : String(err),
          });
        });
    }
  },

  undoLastTick: async () => {
    const { undoToast, progress, dayLogs } = get();
    if (!undoToast) return;

    if (undoTimeoutId) clearTimeout(undoTimeoutId);

    const { itemId, previousStatus } = undoToast;
    const current = progress[itemId];
    if (!current) return;

    const nowIso = new Date().toISOString();
    const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

    const revertedItem: ItemProgress = {
      ...current,
      status: previousStatus,
      updatedAt: nowIso,
    };

    const currentDayLog: DayLog = dayLogs[todayKey] || {
      dayKey: todayKey,
      completed: 0,
      revised: 0,
      minutes: 0,
    };

    let updatedDayLog: DayLog;
    if (previousStatus === 'done') {
      updatedDayLog = {
        ...currentDayLog,
        completed: (currentDayLog.completed || 0) + 1,
      };
    } else {
      updatedDayLog = {
        ...currentDayLog,
        completed: Math.max(0, (currentDayLog.completed || 0) - 1),
      };
    }

    const updatedProgress = { ...progress, [itemId]: revertedItem };
    const updatedDayLogs = { ...dayLogs, [todayKey]: updatedDayLog };

    set({
      progress: updatedProgress,
      dayLogs: updatedDayLogs,
      undoToast: null,
    });

    await persistProgressAndDayLog(updatedProgress, updatedDayLogs, itemId);

    const user = auth?.currentUser;
    if (user && db) {
      writeItemProgressToCloud(user.uid, itemId, revertedItem, updatedDayLog)
        .then(() => {
          if (get().syncStatus === 'error') {
            set({ syncStatus: 'synced', syncError: null });
          }
        })
        .catch((err) => {
          console.error('Failed to sync undo to cloud:', err);
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : String(err),
          });
        });
    }
  },

  dismissUndoToast: () => {
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    set({ undoToast: null });
  },

  updateItemProgress: async (itemId: string, updates: Partial<ItemProgress>) => {
    const { progress, dayLogs } = get();
    const current = progress[itemId];
    const now = new Date();
    const nowIso = now.toISOString();
    const todayKey = getDayKey(now, DEFAULT_TIMEZONE);

    const updatedItem: ItemProgress = {
      ...(current || { status: 'not_started' }),
      ...updates,
      lastTouchedAt: nowIso,
      updatedAt: nowIso,
    };

    let updatedDayLogs = dayLogs;
    if (updates.minutes !== undefined && updates.minutes !== current?.minutes) {
      const addedMinutes = (updates.minutes || 0) - (current?.minutes || 0);
      const currentDayLog = dayLogs[todayKey] || {
        dayKey: todayKey,
        completed: 0,
        revised: 0,
        minutes: 0,
      };
      updatedDayLogs = {
        ...dayLogs,
        [todayKey]: {
          ...currentDayLog,
          minutes: Math.max(0, (currentDayLog.minutes || 0) + addedMinutes),
        },
      };
    }

    const updatedProgress = { ...progress, [itemId]: updatedItem };

    set({
      progress: updatedProgress,
      dayLogs: updatedDayLogs,
      lastTouchedId: itemId,
    });

    await persistProgressAndDayLog(updatedProgress, updatedDayLogs, itemId);

    const user = auth?.currentUser;
    if (user && db) {
      const currentDayLog = updatedDayLogs[todayKey];
      writeItemProgressToCloud(user.uid, itemId, updatedItem, currentDayLog)
        .then(() => {
          if (get().syncStatus === 'error') {
            set({ syncStatus: 'synced', syncError: null });
          }
        })
        .catch((err) => {
          console.error('Failed to sync item update to cloud:', err);
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : String(err),
          });
        });
    }
  },

  toggleBookmark: async (itemId: string) => {
    const { progress } = get();
    const current = progress[itemId];
    const newBookmarked = !current?.bookmarked;
    await get().updateItemProgress(itemId, { bookmarked: newBookmarked });
  },

  toggleHideItem: async (itemId: string) => {
    const { hiddenIds } = get();
    const newHidden = new Set(hiddenIds);
    if (newHidden.has(itemId)) {
      newHidden.delete(itemId);
    } else {
      newHidden.add(itemId);
    }

    set({ hiddenIds: newHidden });
    await persistHiddenItems(newHidden);

    const user = auth?.currentUser;
    if (user && db) {
      writeHiddenIdsToCloud(user.uid, Array.from(newHidden))
        .then(() => {
          if (get().syncStatus === 'error') {
            set({ syncStatus: 'synced', syncError: null });
          }
        })
        .catch((err) => {
          console.error('Failed to sync hidden items to cloud:', err);
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : String(err),
          });
        });
    }
  },

  addCustomItem: async (item) => {
    const { customItems } = get();
    const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newCustomItem: CustomItem = {
      id,
      kind: item.kind,
      topicId: item.topicId,
      phaseId: item.phaseId,
      title: item.title,
      order: customItems.length + 1,
      sources: ['+'],
      links: item.links,
      createdAt: Date.now(),
    };

    const updatedCustom = [...customItems, newCustomItem];
    set({ customItems: updatedCustom });
    await persistCustomItems(updatedCustom);

    const user = auth?.currentUser;
    if (user && db) {
      writeCustomItemToCloud(user.uid, newCustomItem)
        .then(() => {
          if (get().syncStatus === 'error') {
            set({ syncStatus: 'synced', syncError: null });
          }
        })
        .catch((err) => {
          console.error('Failed to sync custom item to cloud:', err);
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : String(err),
          });
        });
    }
  },

  exportData: async () => {
    const { progress, customItems, dayLogs, hiddenIds, lastTouchedId } = get();
    return exportBackupJson({
      progress,
      customItems,
      dayLogs,
      hiddenIds,
      lastTouchedId,
    });
  },

  importData: async (json: string) => {
    const backup = await importBackupJson(json);
    set({
      progress: backup.progress,
      customItems: backup.customItems,
      dayLogs: backup.dayLogs,
      hiddenIds: new Set(backup.hiddenIds),
      lastTouchedId: backup.lastTouchedId || null,
    });
  },

  getContinueItemId: () => {
    const { progress, hiddenIds } = get();

    // Iterate through all phases and topics in curriculum order
    for (const phase of allPhases) {
      for (const topic of phase.topics) {
        // Learn subtopics
        for (const subtopic of topic.subtopics || []) {
          if (hiddenIds.has(subtopic.id)) continue;
          const status = progress[subtopic.id]?.status;
          if (status !== 'done') {
            return subtopic.id;
          }
        }
        // Practice items
        for (const practiceItem of topic.practice || []) {
          if (hiddenIds.has(practiceItem.id)) continue;
          const status = progress[practiceItem.id]?.status;
          if (status !== 'done') {
            return practiceItem.id;
          }
        }
      }
    }
    return null;
  },
}));
