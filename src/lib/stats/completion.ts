import { Phase, Topic, ItemProgress } from '@/types/sheet';

export type CountMode = 'all' | 'subtopics_only' | 'practice_only';

export interface CompletionResult {
  completed: number;
  total: number;
  percentage: number; // 0 to 100, rounded to 1 decimal place
  hiddenCount: number;
}

export interface ItemForCompletion {
  id: string;
  kind?: 'subtopic' | 'practice';
}

/**
 * Pure calculation of completion stats over an arbitrary list of items.
 * Properly accounts for count mode and excludes hidden items from the percentage denominator.
 */
export function calculateItemsCompletion(
  items: ItemForCompletion[],
  progressMap: Record<string, ItemProgress> = {},
  hiddenIds: Set<string> | string[] = new Set(),
  mode: CountMode = 'all'
): CompletionResult {
  const hiddenSet = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds);

  let total = 0;
  let completed = 0;
  let hiddenCount = 0;

  for (const item of items) {
    const isHidden = hiddenSet.has(item.id) || progressMap[item.id]?.hidden === true;
    if (isHidden) {
      hiddenCount++;
      continue;
    }

    if (mode === 'subtopics_only' && item.kind === 'practice') {
      continue;
    }
    if (mode === 'practice_only' && item.kind === 'subtopic') {
      continue;
    }

    total++;
    const progress = progressMap[item.id];
    if (progress && progress.status === 'done') {
      completed++;
    }
  }

  const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

  return {
    completed,
    total,
    percentage,
    hiddenCount,
  };
}

/**
 * Calculates completion for a single topic.
 */
export function calculateTopicCompletion(
  topic: Topic,
  progressMap: Record<string, ItemProgress> = {},
  hiddenIds: Set<string> | string[] = new Set(),
  mode: CountMode = 'all'
): CompletionResult {
  const items: ItemForCompletion[] = [
    ...(topic.subtopics || []).map((s) => ({ id: s.id, kind: 'subtopic' as const })),
    ...(topic.practice || []).map((p) => ({ id: p.id, kind: 'practice' as const })),
  ];
  return calculateItemsCompletion(items, progressMap, hiddenIds, mode);
}

/**
 * Calculates completion for a single phase.
 */
export function calculatePhaseCompletion(
  phase: Phase,
  progressMap: Record<string, ItemProgress> = {},
  hiddenIds: Set<string> | string[] = new Set(),
  mode: CountMode = 'all'
): CompletionResult {
  const items: ItemForCompletion[] = [];
  for (const topic of phase.topics || []) {
    for (const subtopic of topic.subtopics || []) {
      items.push({ id: subtopic.id, kind: 'subtopic' });
    }
    for (const practiceItem of topic.practice || []) {
      items.push({ id: practiceItem.id, kind: 'practice' });
    }
  }
  return calculateItemsCompletion(items, progressMap, hiddenIds, mode);
}

/**
 * Calculates overall completion across all phases in the curriculum.
 */
export function calculateOverallCompletion(
  phases: Phase[],
  progressMap: Record<string, ItemProgress> = {},
  hiddenIds: Set<string> | string[] = new Set(),
  mode: CountMode = 'all'
): CompletionResult {
  const items: ItemForCompletion[] = [];
  for (const phase of phases) {
    for (const topic of phase.topics || []) {
      for (const subtopic of topic.subtopics || []) {
        items.push({ id: subtopic.id, kind: 'subtopic' });
      }
      for (const practiceItem of topic.practice || []) {
        items.push({ id: practiceItem.id, kind: 'practice' });
      }
    }
  }
  return calculateItemsCompletion(items, progressMap, hiddenIds, mode);
}
