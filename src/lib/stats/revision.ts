import { addDaysToDayKey } from '@/lib/time';

export const REVISION_INTERVALS = [1, 3, 7, 21, 60] as const;

/**
 * Calculates the next spaced revision step given the current step and confidence rating (1-5).
 * Rule: confidence <= 2 steps back (Math.max(0, currentStep - 1)).
 * Confidence >= 3 advances to the next interval step (up to max step 4).
 */
export function getNextRevisionStep(currentStep: number, confidence: number = 3): number {
  if (confidence <= 2) {
    return Math.max(0, currentStep - 1);
  }
  return Math.min(REVISION_INTERVALS.length - 1, currentStep + 1);
}

/**
 * Returns interval in days for a given step index.
 */
export function getRevisionIntervalDays(step: number): number {
  const clampedStep = Math.max(0, Math.min(REVISION_INTERVALS.length - 1, step));
  return REVISION_INTERVALS[clampedStep];
}

/**
 * Calculates due date (YYYY-MM-DD) for revision from a starting calendar day.
 */
export function calculateRevisionDueDate(fromDayKey: string, step: number): string {
  const days = getRevisionIntervalDays(step);
  return addDaysToDayKey(fromDayKey, days);
}

/**
 * Initial revision state created when an item is marked done.
 */
export function createInitialRevisionState(todayKey: string) {
  return {
    step: 0,
    dueDayKey: calculateRevisionDueDate(todayKey, 0),
  };
}
