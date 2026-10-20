import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { ItemProgress, CustomItem, DayLog, Settings } from '@/types/sheet';

export interface UserDataBundle {
  progress: Record<string, ItemProgress>;
  customItems: CustomItem[];
  dayLogs: Record<string, DayLog>;
  hiddenIds: string[];
  settings?: Settings | null;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

/**
 * Normalizes any timestamp representation (ISO string, number, Firestore Timestamp) to epoch milliseconds.
 */
export function toTimestampMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toMillis' in ts &&
    typeof (ts as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/**
 * Conflict-free, non-destructive merge between local and cloud datasets.
 *
 * Domain Merge Rules:
 * 1. Progress: Newer updatedAt wins on collision. Never silently overwrite either side.
 * 2. DayLogs: Non-destructive union. completed = max(local, cloud), revised = max(local, cloud),
 *    minutes = max(local, cloud), restDay = local || cloud. Study history is never erased.
 * 3. CustomItems: Union by id.
 * 4. HiddenItems: Set union.
 */
export function mergeLocalAndCloudData(
  local: UserDataBundle,
  cloud: UserDataBundle
): {
  merged: UserDataBundle;
  itemsToUpload: {
    progress: Record<string, ItemProgress>;
    customItems: CustomItem[];
    dayLogs: Record<string, DayLog>;
    hiddenIds: string[];
  };
} {
  const mergedProgress: Record<string, ItemProgress> = {};
  const progressToUpload: Record<string, ItemProgress> = {};

  const allItemIds = new Set([
    ...Object.keys(local.progress || {}),
    ...Object.keys(cloud.progress || {}),
  ]);

  for (const id of allItemIds) {
    const localItem = local.progress[id];
    const cloudItem = cloud.progress[id];

    if (localItem && !cloudItem) {
      mergedProgress[id] = localItem;
      progressToUpload[id] = localItem;
    } else if (!localItem && cloudItem) {
      mergedProgress[id] = cloudItem;
    } else if (localItem && cloudItem) {
      const localTime = toTimestampMs(localItem.updatedAt || localItem.lastTouchedAt);
      const cloudTime = toTimestampMs(cloudItem.updatedAt || cloudItem.lastTouchedAt);

      if (localTime >= cloudTime) {
        mergedProgress[id] = localItem;
        if (localTime > cloudTime) {
          progressToUpload[id] = localItem;
        }
      } else {
        mergedProgress[id] = cloudItem;
      }
    }
  }

  // Merge DayLogs (max values to protect study effort)
  const mergedDays: Record<string, DayLog> = {};
  const daysToUpload: Record<string, DayLog> = {};
  const allDayKeys = new Set([
    ...Object.keys(local.dayLogs || {}),
    ...Object.keys(cloud.dayLogs || {}),
  ]);

  for (const dayKey of allDayKeys) {
    const localLog = local.dayLogs[dayKey];
    const cloudLog = cloud.dayLogs[dayKey];

    if (localLog && !cloudLog) {
      mergedDays[dayKey] = localLog;
      daysToUpload[dayKey] = localLog;
    } else if (!localLog && cloudLog) {
      mergedDays[dayKey] = cloudLog;
    } else if (localLog && cloudLog) {
      const mergedLog: DayLog = {
        dayKey,
        completed: Math.max(localLog.completed || 0, cloudLog.completed || 0),
        revised: Math.max(localLog.revised || 0, cloudLog.revised || 0),
        minutes: Math.max(localLog.minutes || 0, cloudLog.minutes || 0),
        restDay: Boolean(localLog.restDay || cloudLog.restDay),
      };
      mergedDays[dayKey] = mergedLog;

      if (
        mergedLog.completed !== cloudLog.completed ||
        mergedLog.revised !== cloudLog.revised ||
        mergedLog.minutes !== cloudLog.minutes ||
        mergedLog.restDay !== cloudLog.restDay
      ) {
        daysToUpload[dayKey] = mergedLog;
      }
    }
  }

  // Merge Custom Items (union by id)
  const customMap = new Map<string, CustomItem>();
  for (const item of cloud.customItems || []) {
    customMap.set(item.id, item);
  }
  const customToUpload: CustomItem[] = [];
  for (const item of local.customItems || []) {
    if (!customMap.has(item.id)) {
      customMap.set(item.id, item);
      customToUpload.push(item);
    }
  }

  // Merge Hidden Items (union)
  const hiddenUnion = Array.from(
    new Set([...(local.hiddenIds || []), ...(cloud.hiddenIds || [])])
  );

  return {
    merged: {
      progress: mergedProgress,
      customItems: Array.from(customMap.values()),
      dayLogs: mergedDays,
      hiddenIds: hiddenUnion,
      settings: cloud.settings || local.settings,
    },
    itemsToUpload: {
      progress: progressToUpload,
      customItems: customToUpload,
      dayLogs: daysToUpload,
      hiddenIds: hiddenUnion,
    },
  };
}

/**
 * Downloads cloud user documents from Firestore.
 */
export async function fetchCloudUserData(uid: string): Promise<UserDataBundle> {
  if (!db) {
    return { progress: {}, customItems: [], dayLogs: {}, hiddenIds: [] };
  }

  const [progressSnap, daysSnap, customSnap, settingsSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'progress')),
    getDocs(collection(db, 'users', uid, 'days')),
    getDocs(collection(db, 'users', uid, 'custom')),
    getDoc(doc(db, 'users', uid, 'meta', 'settings')),
  ]);

  const progress: Record<string, ItemProgress> = {};
  progressSnap.forEach((d) => {
    progress[d.id] = d.data() as ItemProgress;
  });

  const dayLogs: Record<string, DayLog> = {};
  daysSnap.forEach((d) => {
    dayLogs[d.id] = d.data() as DayLog;
  });

  const customItems: CustomItem[] = [];
  customSnap.forEach((d) => {
    customItems.push(d.data() as CustomItem);
  });

  const settingsData = settingsSnap.exists()
    ? (settingsSnap.data() as Settings & { hiddenIds?: string[] })
    : undefined;

  return {
    progress,
    dayLogs,
    customItems,
    hiddenIds: settingsData?.hiddenIds || [],
    settings: settingsData,
  };
}

/**
 * Executes the first sign-in merge and writes newer local data to Firestore in batches.
 */
export async function syncFirstSignIn(
  uid: string,
  localData: UserDataBundle
): Promise<UserDataBundle> {
  if (!db) return localData;

  const cloudData = await fetchCloudUserData(uid);
  const { merged, itemsToUpload } = mergeLocalAndCloudData(localData, cloudData);

  // Upload changes to Firestore in batches (max 500 operations per batch)
  const batch = writeBatch(db);
  let opCount = 0;

  for (const [itemId, prog] of Object.entries(itemsToUpload.progress)) {
    batch.set(doc(db, 'users', uid, 'progress', itemId), prog);
    opCount++;
  }

  for (const [dayKey, dayLog] of Object.entries(itemsToUpload.dayLogs)) {
    batch.set(doc(db, 'users', uid, 'days', dayKey), dayLog);
    opCount++;
  }

  for (const custom of itemsToUpload.customItems) {
    batch.set(doc(db, 'users', uid, 'custom', custom.id), custom);
    opCount++;
  }

  if (merged.settings || merged.hiddenIds.length > 0) {
    batch.set(
      doc(db, 'users', uid, 'meta', 'settings'),
      {
        ...(merged.settings || { tz: 'Asia/Kolkata', dailyTarget: 3 }),
        hiddenIds: merged.hiddenIds,
      },
      { merge: true }
    );
    opCount++;
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return merged;
}

/**
 * Sets up realtime snapshot subscriptions for a signed-in user.
 */
export function subscribeToUserFirestore(
  uid: string,
  callbacks: {
    onProgressUpdate: (progress: Record<string, ItemProgress>) => void;
    onDaysUpdate: (dayLogs: Record<string, DayLog>) => void;
    onCustomUpdate: (custom: CustomItem[]) => void;
    onSettingsUpdate?: (settings: { hiddenIds?: string[] }) => void;
    onError?: (err: Error) => void;
  }
): Unsubscribe {
  if (!db) return () => {};

  const handleError = (err: Error) => {
    if (callbacks.onError) {
      callbacks.onError(err);
    }
  };

  const unsubProgress = onSnapshot(
    collection(db, 'users', uid, 'progress'),
    (snap) => {
      const progress: Record<string, ItemProgress> = {};
      snap.forEach((d) => {
        progress[d.id] = d.data() as ItemProgress;
      });
      callbacks.onProgressUpdate(progress);
    },
    handleError
  );

  const unsubDays = onSnapshot(
    collection(db, 'users', uid, 'days'),
    (snap) => {
      const days: Record<string, DayLog> = {};
      snap.forEach((d) => {
        days[d.id] = d.data() as DayLog;
      });
      callbacks.onDaysUpdate(days);
    },
    handleError
  );

  const unsubCustom = onSnapshot(
    collection(db, 'users', uid, 'custom'),
    (snap) => {
      const custom: CustomItem[] = [];
      snap.forEach((d) => {
        custom.push(d.data() as CustomItem);
      });
      callbacks.onCustomUpdate(custom);
    },
    handleError
  );

  let unsubSettings: Unsubscribe = () => {};
  if (callbacks.onSettingsUpdate) {
    unsubSettings = onSnapshot(
      doc(db, 'users', uid, 'meta', 'settings'),
      (snap) => {
        if (snap.exists() && callbacks.onSettingsUpdate) {
          callbacks.onSettingsUpdate(snap.data() as { hiddenIds?: string[] });
        }
      },
      handleError
    );
  }

  return () => {
    unsubProgress();
    unsubDays();
    unsubCustom();
    unsubSettings();
  };
}

/**
 * Atomically writes an item progress change and DayLog to Firestore.
 */
export async function writeItemProgressToCloud(
  uid: string,
  itemId: string,
  progress: ItemProgress,
  dayLog?: DayLog
): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid, 'progress', itemId), progress);
  if (dayLog) {
    batch.set(doc(db, 'users', uid, 'days', dayLog.dayKey), dayLog);
  }
  await batch.commit();
}

/**
 * Writes a custom item to Firestore.
 */
export async function writeCustomItemToCloud(uid: string, item: CustomItem): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'custom', item.id), item);
}

/**
 * Writes hidden item IDs to Firestore meta/settings document.
 */
export async function writeHiddenIdsToCloud(uid: string, hiddenIds: string[]): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'meta', 'settings'), { hiddenIds }, { merge: true });
}

let syncUnsubscribe: Unsubscribe | null = null;
let initialized = false;

/**
 * Initializes listeners for Firebase Auth and online/offline network changes,
 * orchestrating the first-signin merge and real-time snapshot synchronization.
 */
export function initCloudSync(
  sheetStore: {
    getState: () => {
      isLoaded: boolean;
      progress: Record<string, ItemProgress>;
      customItems: CustomItem[];
      dayLogs: Record<string, DayLog>;
      hiddenIds: Set<string>;
      initialize: () => Promise<void>;
      setSyncStatus: (status: SyncStatus) => void;
      setSyncError: (error: string | null) => void;
      applyCloudSync: (bundle: UserDataBundle) => Promise<void>;
      mergeRemoteProgress: (progress: Record<string, ItemProgress>) => void;
      mergeRemoteDays: (dayLogs: Record<string, DayLog>) => void;
      mergeRemoteCustom: (custom: CustomItem[]) => void;
      mergeRemoteHiddenIds: (hiddenIds: string[]) => void;
    };
  },
  authStore: {
    getState: () => { user: { uid: string } | null };
    subscribe: (
      listener: (
        state: { user: { uid: string } | null },
        prevState: { user: { uid: string } | null }
      ) => void
    ) => () => void;
  }
): () => void {
  if (initialized) return () => {};
  initialized = true;

  const updateNetworkStatus = () => {
    const user = authStore.getState().user;
    if (!user) {
      sheetStore.getState().setSyncStatus('local_only');
    } else if (!navigator.onLine) {
      sheetStore.getState().setSyncStatus('offline');
    } else if (sheetStore.getState().isLoaded) {
      sheetStore.getState().setSyncStatus('synced');
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
  }

  // Handle auth transitions
  const unsubscribeAuth = authStore.subscribe(async (current, prev) => {
    const user = current.user;
    const prevUser = prev?.user;

    if (user?.uid === prevUser?.uid) return;

    if (syncUnsubscribe) {
      syncUnsubscribe();
      syncUnsubscribe = null;
    }

    if (!user) {
      sheetStore.getState().setSyncStatus('local_only');
      sheetStore.getState().setSyncError(null);
      return;
    }

    // Authenticated: run merge
    sheetStore.getState().setSyncStatus('syncing');

    try {
      if (!sheetStore.getState().isLoaded) {
        await sheetStore.getState().initialize();
      }

      const state = sheetStore.getState();
      const localBundle: UserDataBundle = {
        progress: state.progress,
        customItems: state.customItems,
        dayLogs: state.dayLogs,
        hiddenIds: Array.from(state.hiddenIds),
      };

      const merged = await syncFirstSignIn(user.uid, localBundle);
      await sheetStore.getState().applyCloudSync(merged);

      // Attach realtime listeners
      syncUnsubscribe = subscribeToUserFirestore(user.uid, {
        onProgressUpdate: (remoteProgress) => {
          sheetStore.getState().mergeRemoteProgress(remoteProgress);
        },
        onDaysUpdate: (remoteDays) => {
          sheetStore.getState().mergeRemoteDays(remoteDays);
        },
        onCustomUpdate: (remoteCustom) => {
          sheetStore.getState().mergeRemoteCustom(remoteCustom);
        },
        onSettingsUpdate: (settings) => {
          if (settings.hiddenIds) {
            sheetStore.getState().mergeRemoteHiddenIds(settings.hiddenIds);
          }
        },
        onError: (err) => {
          console.error('Firestore subscription error:', err);
          sheetStore.getState().setSyncStatus('error');
          sheetStore.getState().setSyncError(err instanceof Error ? err.message : String(err));
        },
      });

      sheetStore.getState().setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      sheetStore.getState().setSyncError(null);
    } catch (err) {
      console.error('Cloud sync error:', err);
      sheetStore.getState().setSyncStatus('error');
      sheetStore.getState().setSyncError(err instanceof Error ? err.message : String(err));
    }
  });

  return () => {
    if (syncUnsubscribe) {
      syncUnsubscribe();
      syncUnsubscribe = null;
    }
    unsubscribeAuth();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    }
    initialized = false;
  };
}


