import { CoachTheme } from '@/types/sheet';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import avatarLinesSeed from '@/data/avatar-lines.seed.json';

export type ConcreteTheme = 'classic' | 'hero' | 'realm' | 'mahabharata';

export type LineGroup =
  | 'morning'
  | 'study'
  | 'nudge_missed'
  | 'snooze_ack'
  | 'start_ack'
  | 'done_today'
  | 'weekly_review';

export const CONCRETE_THEMES: ConcreteTheme[] = [
  'classic',
  'hero',
  'realm',
  'mahabharata',
];

export const ALL_GROUPS: LineGroup[] = [
  'morning',
  'study',
  'nudge_missed',
  'snooze_ack',
  'start_ack',
  'done_today',
  'weekly_review',
];

// In-memory cache tracking the last picked raw line per theme+group to ensure no immediate repeat
const lastPickedMap = new Map<string, string>();

/**
 * Clears the last picked line tracking cache (useful for isolated unit testing).
 */
export function clearLastPickedLinesForTest(): void {
  lastPickedMap.clear();
}

/**
 * Accesses the full typed avatar lines seed dataset.
 */
export function getAvatarLinesData() {
  return avatarLinesSeed;
}

/**
 * Resolves a CoachTheme to a concrete theme.
 * When set to 'mix', deterministically rotates through the concrete themes each calendar day.
 */
export function resolveCoachTheme(
  theme: CoachTheme = 'classic',
  date: Date = new Date()
): ConcreteTheme {
  if (theme !== 'mix') {
    return theme;
  }

  const dayKey = getDayKey(date, DEFAULT_TIMEZONE);
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }

  return CONCRETE_THEMES[hash % CONCRETE_THEMES.length];
}

/**
 * Picks a coach line for a given slot/group and theme.
 * - Replaces '{name}' with the learner's first name.
 * - Guarantees that the exact same line is never repeated twice in a row for the same theme & group.
 */
export function pickLine(
  slot: string,
  theme: CoachTheme = 'classic',
  name: string = 'friend',
  date: Date = new Date()
): string {
  const concreteTheme = resolveCoachTheme(theme, date);
  const themeData = avatarLinesSeed.themes[concreteTheme] || avatarLinesSeed.themes.classic;

  const validGroup = (slot in themeData ? slot : 'study') as LineGroup;
  const lines: string[] = themeData[validGroup] || themeData.study;

  const cacheKey = `${concreteTheme}:${validGroup}`;
  const previousLine = lastPickedMap.get(cacheKey);

  let chosenLine: string;

  if (lines.length > 1 && previousLine) {
    const candidates = lines.filter((l) => l !== previousLine);
    const pool = candidates.length > 0 ? candidates : lines;
    const randomIndex = Math.floor(Math.random() * pool.length);
    chosenLine = pool[randomIndex];
  } else {
    const randomIndex = Math.floor(Math.random() * lines.length);
    chosenLine = lines[randomIndex] || lines[0];
  }

  lastPickedMap.set(cacheKey, chosenLine);

  const cleanName = (name && name.trim()) || 'there';
  return chosenLine.replace(/\{name\}/g, cleanName);
}
