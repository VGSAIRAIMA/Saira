import React, { useState, useEffect, useRef } from 'react';
import { allPhases } from '@/lib/seed';
import { useSheetStore } from '@/stores/useSheetStore';
import { Search, X, Layers, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { progress, setSelectedPhaseId, setSelectedItemId } = useSheetStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  const normalized = query.trim().toLowerCase();

  // Find matching items grouped by phase
  const groupedResults = normalized
    ? allPhases
        .map((phase) => {
          const matchingItems: Array<{
            id: string;
            title: string;
            topicTitle: string;
            matchedOn?: string;
          }> = [];

          for (const topic of phase.topics) {
            // subtopics
            for (const subtopic of topic.subtopics || []) {
              const prog = progress[subtopic.id];
              const title = prog?.titleOverride || subtopic.title;
              const notes = prog?.notes || '';
              const keyIdea = prog?.keyIdea || '';

              if (title.toLowerCase().includes(normalized)) {
                matchingItems.push({ id: subtopic.id, title, topicTitle: topic.title });
              } else if (keyIdea.toLowerCase().includes(normalized)) {
                matchingItems.push({
                  id: subtopic.id,
                  title,
                  topicTitle: topic.title,
                  matchedOn: `Key Idea: ${keyIdea}`,
                });
              } else if (notes.toLowerCase().includes(normalized)) {
                matchingItems.push({
                  id: subtopic.id,
                  title,
                  topicTitle: topic.title,
                  matchedOn: 'Notes match',
                });
              }
            }

            // practice
            for (const pr of topic.practice || []) {
              const prog = progress[pr.id];
              const title = prog?.titleOverride || pr.title;
              const notes = prog?.notes || '';
              const keyIdea = prog?.keyIdea || '';

              if (title.toLowerCase().includes(normalized)) {
                matchingItems.push({ id: pr.id, title, topicTitle: topic.title });
              } else if (keyIdea.toLowerCase().includes(normalized)) {
                matchingItems.push({
                  id: pr.id,
                  title,
                  topicTitle: topic.title,
                  matchedOn: `Key Idea: ${keyIdea}`,
                });
              } else if (notes.toLowerCase().includes(normalized)) {
                matchingItems.push({
                  id: pr.id,
                  title,
                  topicTitle: topic.title,
                  matchedOn: 'Notes match',
                });
              }
            }
          }

          return {
            phase,
            items: matchingItems,
          };
        })
        .filter((group) => group.items.length > 0)
    : [];

  const handleSelect = (phaseId: string, itemId: string) => {
    setSelectedPhaseId(phaseId);
    setSelectedItemId(itemId);
    handleClose();

    setTimeout(() => {
      const el = document.getElementById(`item-${itemId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
      />
      <div className="fixed inset-x-4 top-20 max-w-2xl mx-auto bg-surface border border-border rounded-2xl z-50 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-2/30">
          <Search className="w-5 h-5 text-muted-foreground flex-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, problems, key ideas, notes... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {normalized && groupedResults.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!normalized && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Type to search across all 381 checklist items, personal notes, and key ideas.
            </div>
          )}

          {groupedResults.map(({ phase, items }) => (
            <div key={phase.id} className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>
                  Phase {phase.order}: {phase.title} ({items.length})
                </span>
              </div>

              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(phase.id, item.id)}
                    className="w-full text-left p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-surface-2/60 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono block truncate">
                        {item.topicTitle}
                      </span>
                      {item.matchedOn && (
                        <span className="text-[10px] text-primary/80 italic block mt-0.5">
                          {item.matchedOn}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors flex-none" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
