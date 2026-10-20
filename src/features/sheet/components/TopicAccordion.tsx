import React, { useState } from 'react';
import { Topic } from '@/types/sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import { calculateTopicCompletion } from '@/lib/stats/completion';
import { ItemRow } from './ItemRow';
import {
  ChevronRight,
  CheckCheck,
  Plus,
  BookOpen,
  Code2,
  Info,
} from 'lucide-react';

interface TopicAccordionProps {
  topic: Topic;
  phaseOrder: number;
  focusedItemId?: string | null;
  onOpenAddModal: (topicId: string) => void;
}

export const TopicAccordion: React.FC<TopicAccordionProps> = ({
  topic,
  phaseOrder,
  focusedItemId,
  onOpenAddModal,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const {
    progress,
    customItems,
    hiddenIds,
    countMode,
    filters,
    searchQuery,
    toggleItemDone,
  } = useSheetStore();

  const stats = calculateTopicCompletion(topic, progress, hiddenIds, countMode);
  const accentColor = `var(--ph${phaseOrder})`;

  // Combine seed items with custom items for this topic
  const topicCustomItems = customItems.filter((c) => c.topicId === topic.id);
  const customSubtopics = topicCustomItems.filter((c) => c.kind === 'subtopic');
  const customPractice = topicCustomItems.filter((c) => c.kind === 'practice');

  const allSubtopics = [...(topic.subtopics || []), ...customSubtopics];
  const allPractice = [...(topic.practice || []), ...customPractice];

  // Filtering function
  const matchesFilters = (
    item: (typeof allSubtopics)[0] | (typeof allPractice)[0],
    kind: 'subtopic' | 'practice'
  ) => {
    // Hidden check
    if (hiddenIds.has(item.id)) return false;

    const itemProg = progress[item.id];
    const status = itemProg?.status || 'not_started';

    // Status filter
    if (filters.status !== 'all' && status !== filters.status) {
      return false;
    }

    // Source tag filter
    if (filters.source !== 'all') {
      const sources = 'sources' in item ? item.sources || [] : [];
      if (!sources.includes(filters.source)) return false;
    }

    // Bookmarked filter
    if (filters.bookmarkedOnly && !itemProg?.bookmarked) {
      return false;
    }

    // Due for revision filter
    if (filters.dueRevisionOnly && !itemProg?.revision?.dueDayKey) {
      return false;
    }

    // Low confidence filter (<= 2)
    if (filters.lowConfidenceOnly && (itemProg?.confidence || 0) > 2) {
      return false;
    }

    // Has notes filter
    if (filters.hasNotesOnly && !itemProg?.notes?.trim()) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const noteMatch = itemProg?.notes?.toLowerCase().includes(q) || false;
      const keyIdeaMatch = itemProg?.keyIdea?.toLowerCase().includes(q) || false;
      if (!titleMatch && !noteMatch && !keyIdeaMatch) {
        return false;
      }
    }

    // Count mode filter
    if (countMode === 'subtopics_only' && kind === 'practice') return false;
    if (countMode === 'practice_only' && kind === 'subtopic') return false;

    return true;
  };

  const filteredSubtopics = allSubtopics.filter((s) => matchesFilters(s, 'subtopic'));
  const filteredPractice = allPractice.filter((p) => matchesFilters(p, 'practice'));

  const totalVisible = filteredSubtopics.length + filteredPractice.length;
  if (totalVisible === 0 && (searchQuery.trim() || filters.status !== 'all' || filters.bookmarkedOnly)) {
    // Hide empty topic when filters are active and nothing matches
    return null;
  }

  const handleMarkAllLearnDone = () => {
    const uncompleted = allSubtopics.filter((s) => progress[s.id]?.status !== 'done');
    if (uncompleted.length === 0) return;

    if (
      window.confirm(
        `Mark all ${uncompleted.length} learn items in "${topic.title}" as completed?`
      )
    ) {
      uncompleted.forEach((s) => {
        toggleItemDone(s.id, s.title);
      });
    }
  };

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-2/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground flex-none transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-foreground truncate">
                {topic.title}
              </h2>

              {topic.sources.map((src) => (
                <span
                  key={src}
                  className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded ${
                    src === 'K'
                      ? 'bg-[#1b2a40] text-[#9cc2ff]'
                      : src === 'S'
                        ? 'bg-[#3b2616] text-[#ffb877]'
                        : 'bg-surface-2 text-muted-foreground border border-border/60'
                  }`}
                >
                  {src}
                </span>
              ))}

              {topic.striverSection && (
                <span className="text-[10px] text-muted-foreground font-mono bg-surface-2 px-1.5 py-0.2 rounded border border-border/40">
                  {topic.striverSection}
                </span>
              )}
            </div>

            {topic.note && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Info className="w-3 h-3 text-primary flex-none" />
                <span className="truncate">{topic.note}</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress & Counter */}
        <div className="flex items-center gap-3 flex-none">
          <div className="text-right">
            <span className="text-xs font-mono font-medium text-foreground">
              {stats.completed}/{stats.total}
            </span>
            <span className="block text-[10px] text-muted-foreground font-mono">
              {stats.percentage}%
            </span>
          </div>

          <div className="hidden sm:block w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${stats.percentage}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="border-t border-border/60 p-2 sm:p-3 space-y-4 bg-surface-2/15">
          {/* Group 1: Learn Checklist */}
          {filteredSubtopics.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="w-3 h-3 text-primary" />
                <span>Learn ({filteredSubtopics.length})</span>
              </div>

              <div className="space-y-0.5">
                {filteredSubtopics.map((subtopic) => (
                  <ItemRow
                    key={subtopic.id}
                    item={subtopic}
                    kind="subtopic"
                    topicId={topic.id}
                    phaseOrder={phaseOrder}
                    isFocused={focusedItemId === subtopic.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Practice Problems */}
          {filteredPractice.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Code2 className="w-3 h-3 text-warning" />
                <span>Practice Candidates ({filteredPractice.length})</span>
              </div>

              <div className="space-y-0.5">
                {filteredPractice.map((practiceItem) => (
                  <ItemRow
                    key={practiceItem.id}
                    item={practiceItem}
                    kind="practice"
                    topicId={topic.id}
                    phaseOrder={phaseOrder}
                    isFocused={focusedItemId === practiceItem.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Topic Footer Actions */}
          <div className="flex items-center justify-between pt-2 px-2 border-t border-border/40 text-xs">
            <button
              onClick={handleMarkAllLearnDone}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark learn items done</span>
            </button>

            <button
              onClick={() => onOpenAddModal(topic.id)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
