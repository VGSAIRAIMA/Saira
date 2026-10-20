import rawSheet from '@/data/sheet.seed.json';
import { SheetSeed, Phase, Topic, Subtopic, PracticeItem } from '@/types/sheet';

export const sheetSeed = rawSheet as unknown as SheetSeed;

export interface TrackableItemMeta {
  id: string;
  title: string;
  kind: 'subtopic' | 'practice';
  topic: Topic;
  phase: Phase;
  item: Subtopic | PracticeItem;
}

const itemIndex = new Map<string, TrackableItemMeta>();
const topicIndex = new Map<string, { topic: Topic; phase: Phase }>();
const phaseIndex = new Map<string, Phase>();

const allPhasesList: Phase[] = [];
const allTopicsList: Topic[] = [];
const allSubtopicsList: Subtopic[] = [];
const allPracticeList: PracticeItem[] = [];

// Initialize indices once
sheetSeed.phases.forEach((phase) => {
  allPhasesList.push(phase);
  phaseIndex.set(phase.id, phase);

  phase.topics.forEach((topic) => {
    allTopicsList.push(topic);
    topicIndex.set(topic.id, { topic, phase });

    (topic.subtopics || []).forEach((subtopic) => {
      allSubtopicsList.push(subtopic);
      itemIndex.set(subtopic.id, {
        id: subtopic.id,
        title: subtopic.title,
        kind: 'subtopic',
        topic,
        phase,
        item: subtopic,
      });
    });

    (topic.practice || []).forEach((practiceItem) => {
      allPracticeList.push(practiceItem);
      itemIndex.set(practiceItem.id, {
        id: practiceItem.id,
        title: practiceItem.title,
        kind: 'practice',
        topic,
        phase,
        item: practiceItem,
      });
    });
  });
});

export const allPhases = allPhasesList;
export const allTopics = allTopicsList;
export const allSubtopics = allSubtopicsList;
export const allPracticeItems = allPracticeList;

export function getItemMeta(id: string): TrackableItemMeta | undefined {
  return itemIndex.get(id);
}

export function getTopicMeta(topicId: string): { topic: Topic; phase: Phase } | undefined {
  return topicIndex.get(topicId);
}

export function getPhaseMeta(phaseId: string): Phase | undefined {
  return phaseIndex.get(phaseId);
}

export function getAllTrackableItemIds(): string[] {
  return Array.from(itemIndex.keys());
}
