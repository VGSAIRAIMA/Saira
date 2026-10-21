import { get, set } from 'idb-keyval';
import { ItemProgress, CustomItem, DayLog, Settings } from '@/types/sheet';

export const KEYS = {
  PROGRESS: 'saira:progress',
  CUSTOM_ITEMS: 'saira:custom_items',
  DAY_LOGS: 'saira:day_logs',
  HIDDEN_ITEMS: 'saira:hidden_items',
  LAST_TOUCHED: 'saira:last_touched',
  SETTINGS: 'saira:settings',
  FAVORITE_QUOTES: 'saira:favorite_quotes',
};

// Fallback memory store for testing/environments without IndexedDB
const memoryStore = new Map<string, unknown>();

async function safeGet<T>(key: string, defaultValue: T): Promise<T> {
  try {
    if (typeof indexedDB !== 'undefined') {
      const val = await get<T>(key);
      return val !== undefined ? val : defaultValue;
    }
  } catch (err) {
    console.warn(`IndexedDB read failed for ${key}, using memory fallback:`, err);
  }
  return memoryStore.has(key) ? (memoryStore.get(key) as T) : defaultValue;
}

async function safeSet<T>(key: string, value: T): Promise<void> {
  memoryStore.set(key, value);
  try {
    if (typeof indexedDB !== 'undefined') {
      await set(key, value);
    }
  } catch (err) {
    console.warn(`IndexedDB write failed for ${key}:`, err);
  }
}

export interface BackupData {
  version: number;
  exportedAt: string;
  progress: Record<string, ItemProgress>;
  customItems: CustomItem[];
  dayLogs: Record<string, DayLog>;
  hiddenIds: string[];
  settings?: Settings;
  lastTouchedId?: string | null;
}

export async function loadInitialData() {
  const [progress, customItems, dayLogs, hiddenIds, lastTouchedId, settings, favoriteQuotes] =
    await Promise.all([
      safeGet<Record<string, ItemProgress>>(KEYS.PROGRESS, {}),
      safeGet<CustomItem[]>(KEYS.CUSTOM_ITEMS, []),
      safeGet<Record<string, DayLog>>(KEYS.DAY_LOGS, {}),
      safeGet<string[]>(KEYS.HIDDEN_ITEMS, []),
      safeGet<string | null>(KEYS.LAST_TOUCHED, null),
      safeGet<Settings | null>(KEYS.SETTINGS, null),
      safeGet<string[]>(KEYS.FAVORITE_QUOTES, []),
    ]);

  return {
    progress: progress || {},
    customItems: customItems || [],
    dayLogs: dayLogs || {},
    hiddenIds: new Set(hiddenIds || []),
    lastTouchedId: lastTouchedId || null,
    settings: settings || null,
    favoriteQuotes: new Set(favoriteQuotes || []),
  };
}

export async function persistProgressAndDayLog(
  progress: Record<string, ItemProgress>,
  dayLogs: Record<string, DayLog>,
  lastTouchedId?: string
): Promise<void> {
  const promises: Promise<void>[] = [
    safeSet(KEYS.PROGRESS, progress),
    safeSet(KEYS.DAY_LOGS, dayLogs),
  ];
  if (lastTouchedId) {
    promises.push(safeSet(KEYS.LAST_TOUCHED, lastTouchedId));
  }
  await Promise.all(promises);
}

export async function persistCustomItems(customItems: CustomItem[]): Promise<void> {
  await safeSet(KEYS.CUSTOM_ITEMS, customItems);
}

export async function persistHiddenItems(hiddenIds: Set<string> | string[]): Promise<void> {
  const arr = hiddenIds instanceof Set ? Array.from(hiddenIds) : hiddenIds;
  await safeSet(KEYS.HIDDEN_ITEMS, arr);
}

export async function persistFavoriteQuotes(quoteIds: Set<string> | string[]): Promise<void> {
  const arr = quoteIds instanceof Set ? Array.from(quoteIds) : quoteIds;
  await safeSet(KEYS.FAVORITE_QUOTES, arr);
}

export async function persistSettings(settings: Settings): Promise<void> {
  await safeSet(KEYS.SETTINGS, settings);
}

export async function exportBackupJson(data: {
  progress: Record<string, ItemProgress>;
  customItems: CustomItem[];
  dayLogs: Record<string, DayLog>;
  hiddenIds: Set<string> | string[];
  settings?: Settings;
  lastTouchedId?: string | null;
}): Promise<string> {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: data.progress,
    customItems: data.customItems,
    dayLogs: data.dayLogs,
    hiddenIds: data.hiddenIds instanceof Set ? Array.from(data.hiddenIds) : data.hiddenIds,
    settings: data.settings,
    lastTouchedId: data.lastTouchedId,
  };
  return JSON.stringify(backup, null, 2);
}

/** Escape a CSV field: wrap in quotes and double any internal quotes. */
function csvField(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Export progress as a flat CSV (one row per item).
 * Columns: itemId, status, confidence, minutes, attempts, bookmarked,
 *          completedAt, lastTouchedAt, updatedAt, notes, keyIdea, mistakes
 */
export function exportBackupCsv(progress: Record<string, ItemProgress>): string {
  const header = [
    'itemId',
    'status',
    'confidence',
    'minutes',
    'attempts',
    'bookmarked',
    'completedAt',
    'lastTouchedAt',
    'updatedAt',
    'notes',
    'keyIdea',
    'mistakes',
  ].join(',');

  const rows = Object.entries(progress).map(([id, p]) =>
    [
      id,
      p.status,
      p.confidence ?? '',
      p.minutes ?? '',
      p.attempts ?? '',
      p.bookmarked ? 'true' : 'false',
      p.completedAt ? String(p.completedAt) : '',
      p.lastTouchedAt ? String(p.lastTouchedAt) : '',
      p.updatedAt ? String(p.updatedAt) : '',
      p.notes ?? '',
      p.keyIdea ?? '',
      p.mistakes ?? '',
    ]
      .map(csvField)
      .join(',')
  );

  return [header, ...rows].join('\n');
}

export async function importBackupJson(jsonString: string): Promise<BackupData> {
  const parsed = JSON.parse(jsonString) as BackupData;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file: Not a valid JSON object');
  }
  if (!parsed.progress || typeof parsed.progress !== 'object') {
    throw new Error('Invalid backup file: Missing progress data');
  }

  // Persist directly to storage
  await Promise.all([
    safeSet(KEYS.PROGRESS, parsed.progress || {}),
    safeSet(KEYS.CUSTOM_ITEMS, parsed.customItems || []),
    safeSet(KEYS.DAY_LOGS, parsed.dayLogs || {}),
    safeSet(KEYS.HIDDEN_ITEMS, parsed.hiddenIds || []),
    parsed.settings ? safeSet(KEYS.SETTINGS, parsed.settings) : Promise.resolve(),
    parsed.lastTouchedId ? safeSet(KEYS.LAST_TOUCHED, parsed.lastTouchedId) : Promise.resolve(),
  ]);

  return parsed;
}
