export type Status = 'not_started' | 'in_progress' | 'done' | 'needs_revision';

export type SourceTag = 'K' | 'S' | '+';

export interface Subtopic {
  id: string;
  title: string;
  sources: SourceTag[];
}

export interface PracticeItem {
  id: string;
  title: string;
  verified: boolean;
  link: string | null;
}

export interface Topic {
  id: string;
  order: number;
  title: string;
  sources: SourceTag[];
  expanded?: boolean;
  striverSection?: string | null;
  note?: string | null;
  subtopics: Subtopic[];
  practice: PracticeItem[];
}

export interface Phase {
  id: string;
  order: number;
  title: string;
  description: string;
  topics: Topic[];
}

export interface SheetSeed {
  schemaVersion: number;
  language: string;
  sourceTags: Record<string, string>;
  verification: {
    strivertotal: number;
    striverSectionCountsFromLivePage: Array<{ section: string; problems: number }>;
    unverified: string[];
  };
  phases: Phase[];
}

export interface ItemProgress {
  status: Status;
  confidence?: 1 | 2 | 3 | 4 | 5;
  keyIdea?: string;
  mistakes?: string;
  notes?: string;
  links?: {
    video?: string;
    article?: string;
    practice?: string;
  };
  minutes?: number;
  attempts?: number;
  bookmarked?: boolean;
  hidden?: boolean;
  completedAt?: string | number | null;
  lastTouchedAt?: string | number | null;
  revision?: {
    step: number;
    dueDayKey: string;
    lastRevisedAt?: string | number | null;
  };
  titleOverride?: string;
  updatedAt: string | number;
}

export interface DayLog {
  dayKey: string;
  completed: number;
  revised: number;
  minutes: number;
  restDay?: boolean;
}

export type CoachTheme = 'classic' | 'hero' | 'realm' | 'mahabharata' | 'mix';

export interface ReminderSettings {
  morningTime: string;          // e.g. "08:30"
  studyTime: string;            // e.g. "19:00"
  daysOfWeek: number[];         // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday, 1 = Monday, ...)
  voiceEnabled: boolean;        // default: true
  snoozeMinutes: number;        // default: 15
  quietHoursEnabled: boolean;   // default: false
  quietHoursStart: string;      // default: "22:00"
  quietHoursEnd: string;        // default: "07:00"
  notificationsEnabled: boolean;// default: false
  coachTheme?: CoachTheme;      // default: 'classic'
}

export interface ReminderState {
  lastFiredSlot?: string;       // "morning" | "study"
  lastFiredDate?: string;       // YYYY-MM-DD
  snoozeCount?: number;         // 0 to 3
  snoozeUntil?: number | null;  // timestamp ms
  dismissedSlots?: string[];    // e.g. ["2026-10-21:morning"]
  missedNudgeFiredForDate?: string; // YYYY-MM-DD
}

export interface Settings {
  tz: string;
  dailyTarget: number;
  activeThresholdMinutes?: number;
  voice?: boolean;
  reminders?: ReminderSettings;
}

export interface CustomItem {
  id: string;
  kind: 'subtopic' | 'practice';
  topicId: string;
  phaseId: string;
  title: string;
  order: number;
  sources?: SourceTag[];
  links?: {
    video?: string;
    article?: string;
    practice?: string;
  };
  createdAt: number;
}

