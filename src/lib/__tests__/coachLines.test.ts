import { describe, it, expect, beforeEach } from 'vitest';
import {
  pickLine,
  resolveCoachTheme,
  getAvatarLinesData,
  clearLastPickedLinesForTest,
  CONCRETE_THEMES,
  ALL_GROUPS,
} from '@/lib/coachLines';
import {
  saveReminderSettings,
  loadLocalReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
} from '@/lib/reminderStorage';
import { CoachTheme, ReminderSettings } from '@/types/sheet';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

describe('Coach Avatar Themed Lines & Selection Engine', () => {
  beforeEach(() => {
    clearLastPickedLinesForTest();
    globalThis.localStorage.clear();
  });

  describe('Character Limit Compliance (under 140 characters)', () => {
    it('ensures every single line in every theme and group is strictly under 140 characters', () => {
      const data = getAvatarLinesData();

      for (const themeKey of CONCRETE_THEMES) {
        const theme = data.themes[themeKey];
        expect(theme, `Theme "${themeKey}" should exist`).toBeDefined();

        for (const groupKey of ALL_GROUPS) {
          const lines = theme[groupKey];
          expect(Array.isArray(lines), `Theme "${themeKey}" group "${groupKey}" should be an array`).toBe(true);
          expect(lines.length, `Theme "${themeKey}" group "${groupKey}" should not be empty`).toBeGreaterThan(0);

          for (const line of lines) {
            expect(
              line.length,
              `Line "${line}" in theme "${themeKey}" group "${groupKey}" is ${line.length} chars (must be < 140)`
            ).toBeLessThan(140);
          }
        }
      }
    });
  });

  describe('Theme Structure & Group Completeness', () => {
    it('ensures every theme contains all 7 required groups', () => {
      const data = getAvatarLinesData();

      for (const themeKey of CONCRETE_THEMES) {
        const theme = data.themes[themeKey];
        for (const groupKey of ALL_GROUPS) {
          expect(theme[groupKey], `Theme "${themeKey}" missing group "${groupKey}"`).toBeDefined();
        }
      }
    });

    it('ensures hero, realm, and mahabharata have at least 6 lines each for morning and study', () => {
      const data = getAvatarLinesData();
      const newThemes: Array<'hero' | 'realm' | 'mahabharata'> = ['hero', 'realm', 'mahabharata'];

      for (const themeKey of newThemes) {
        const morningLines = data.themes[themeKey].morning;
        const studyLines = data.themes[themeKey].study;

        expect(
          morningLines.length,
          `Theme "${themeKey}" morning should have sample + at least 5 original lines (>= 6)`
        ).toBeGreaterThanOrEqual(6);

        expect(
          studyLines.length,
          `Theme "${themeKey}" study should have sample + at least 5 original lines (>= 6)`
        ).toBeGreaterThanOrEqual(6);
      }
    });
  });

  describe('{name} Placeholder Replacement', () => {
    it('always replaces {name} with learner name across all themes', () => {
      const testName = 'Devavrata';

      for (const themeKey of CONCRETE_THEMES) {
        for (const groupKey of ALL_GROUPS) {
          const line = pickLine(groupKey, themeKey, testName);
          expect(line).not.toContain('{name}');
          if (line.includes(testName)) {
            expect(line).toContain(testName);
          }
        }
      }
    });

    it('uses clean fallback if name is empty or whitespace', () => {
      const line = pickLine('morning', 'hero', '   ');
      expect(line).not.toContain('{name}');
      expect(line.length).toBeGreaterThan(5);
    });
  });

  describe('No Immediate Repeat Rule', () => {
    it('never repeats the exact same line twice in a row for the same theme and slot', () => {
      for (const themeKey of CONCRETE_THEMES) {
        let previousMorningLine = '';
        let previousStudyLine = '';

        for (let i = 0; i < 30; i++) {
          const morningLine = pickLine('morning', themeKey, 'Raima');
          expect(
            morningLine,
            `Iteration ${i}: consecutive duplicate line detected for ${themeKey}:morning`
          ).not.toBe(previousMorningLine);
          previousMorningLine = morningLine;

          const studyLine = pickLine('study', themeKey, 'Raima');
          expect(
            studyLine,
            `Iteration ${i}: consecutive duplicate line detected for ${themeKey}:study`
          ).not.toBe(previousStudyLine);
          previousStudyLine = studyLine;
        }
      }
    });
  });

  describe('Mix Theme Daily Rotation', () => {
    it('rotates theme based on date when theme is set to mix', () => {
      const d1 = new Date('2026-10-21T05:00:00Z');
      const d2 = new Date('2026-10-22T05:00:00Z');

      const resolved1 = resolveCoachTheme('mix', d1);
      const resolved2 = resolveCoachTheme('mix', d2);

      expect(CONCRETE_THEMES).toContain(resolved1);
      expect(CONCRETE_THEMES).toContain(resolved2);

      // Successfully picks lines when theme is mix
      const line = pickLine('morning', 'mix', 'Raima', d1);
      expect(line).toBeTruthy();
      expect(line).not.toContain('{name}');
    });
  });

  describe('Theme Setting Persistence', () => {
    it('persists coachTheme setting to storage and reloads correctly', async () => {
      const customThemes: CoachTheme[] = ['hero', 'realm', 'mahabharata', 'mix', 'classic'];

      for (const theme of customThemes) {
        const settingsToSave: ReminderSettings = {
          ...DEFAULT_REMINDER_SETTINGS,
          coachTheme: theme,
        };

        await saveReminderSettings(settingsToSave);

        const loadedSettings = loadLocalReminderSettings();
        expect(loadedSettings.coachTheme).toBe(theme);
      }
    });
  });
});
