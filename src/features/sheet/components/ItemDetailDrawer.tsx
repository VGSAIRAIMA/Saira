import React, { useState, useEffect, useRef } from 'react';
import { Status } from '@/types/sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import { getItemMeta } from '@/lib/seed';
import {
  X,
  Star,
  EyeOff,
  Video,
  BookOpen,
  Code,
  Play,
  Square,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ItemDetailContentProps {
  itemId: string;
  onClose: () => void;
}

const ItemDetailContent: React.FC<ItemDetailContentProps> = ({ itemId, onClose }) => {
  const {
    progress,
    updateItemProgress,
    toggleBookmark,
    toggleHideItem,
    hiddenIds,
    customItems,
  } = useSheetStore();

  const itemMeta = getItemMeta(itemId);
  const customItem = customItems.find((c) => c.id === itemId);
  const itemProgress = progress[itemId];

  const initialTitle =
    itemProgress?.titleOverride || itemMeta?.title || customItem?.title || '';
  const initialLinks =
    itemProgress?.links ||
    (itemMeta?.item && 'links' in itemMeta.item
      ? (itemMeta.item as { links?: { video?: string; article?: string; practice?: string } })
          .links
      : undefined);

  // Local draft states initialized once per key={itemId} mount
  const [titleDraft, setTitleDraft] = useState(initialTitle);
  const [keyIdeaDraft, setKeyIdeaDraft] = useState(itemProgress?.keyIdea || '');
  const [mistakesDraft, setMistakesDraft] = useState(itemProgress?.mistakes || '');
  const [notesDraft, setNotesDraft] = useState(itemProgress?.notes || '');
  const [videoUrlDraft, setVideoUrlDraft] = useState(initialLinks?.video || '');
  const [articleUrlDraft, setArticleUrlDraft] = useState(initialLinks?.article || '');
  const [practiceUrlDraft, setPracticeUrlDraft] = useState(initialLinks?.practice || '');

  // Study timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        const currentMin = progress[itemId]?.minutes || 0;
        updateItemProgress(itemId, { minutes: currentMin + 1 });
      }, 60000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, itemId, progress, updateItemProgress]);

  const status: Status = itemProgress?.status || 'not_started';
  const confidence = itemProgress?.confidence || 0;
  const isBookmarked = !!itemProgress?.bookmarked;
  const isHidden = hiddenIds.has(itemId);
  const minutes = itemProgress?.minutes || 0;
  const attempts = itemProgress?.attempts || 0;

  const phaseOrder = itemMeta?.phase.order ?? 0;
  const accentColor = `var(--ph${phaseOrder})`;

  const handleSaveNotes = () => {
    updateItemProgress(itemId, {
      notes: notesDraft.slice(0, 20000),
    });
  };

  const handleSaveLinks = () => {
    updateItemProgress(itemId, {
      links: {
        video: videoUrlDraft.trim() || undefined,
        article: articleUrlDraft.trim() || undefined,
        practice: practiceUrlDraft.trim() || undefined,
      },
    });
  };

  const handleStatusChange = (newStatus: Status) => {
    updateItemProgress(itemId, { status: newStatus });
  };

  const handleConfidenceChange = (val: 1 | 2 | 3 | 4 | 5) => {
    const updates: Partial<typeof itemProgress> = { confidence: val };
    if (val <= 2 && status === 'done') {
      updates.status = 'needs_revision';
    }
    updateItemProgress(itemId, updates);
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-surface border-l border-border z-50 flex flex-col shadow-2xl animate-fade-rise overflow-hidden">
      {/* Drawer Header */}
      <div className="p-5 border-b border-border flex items-start justify-between gap-4 bg-surface-2/30">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>{itemMeta?.phase.title || 'Curriculum'}</span>
            <span>/</span>
            <span className="truncate">{itemMeta?.topic.title || 'Topic'}</span>
          </div>

          <input
            type="text"
            value={titleDraft}
            onChange={(e) => {
              setTitleDraft(e.target.value);
              updateItemProgress(itemId, { titleOverride: e.target.value });
            }}
            placeholder="Item Title"
            className="text-base sm:text-lg font-semibold text-foreground bg-transparent w-full border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none py-0.5"
          />
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors flex-none"
          aria-label="Close detail panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Status Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'not_started', label: 'Not Started' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'done', label: 'Done' },
                { id: 'needs_revision', label: 'Needs Revision' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStatusChange(s.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  status === s.id
                    ? s.id === 'done'
                      ? 'bg-success/20 border-success text-success font-semibold'
                      : s.id === 'needs_revision'
                        ? 'bg-danger/20 border-danger text-danger font-semibold'
                        : s.id === 'in_progress'
                          ? 'bg-warning/20 border-warning text-warning font-semibold'
                          : 'bg-surface-2 border-border text-foreground font-semibold'
                    : 'border-border/60 bg-surface-2/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Rating (1 - 5) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
              Confidence Rating
            </span>
            <span className="font-mono text-muted-foreground">
              {confidence === 0
                ? 'Not rated'
                : confidence === 1
                  ? '1 - Shaky'
                  : confidence === 2
                    ? '2 - Needs Practice'
                    : confidence === 3
                      ? '3 - Comfortable'
                      : confidence === 4
                        ? '4 - Strong'
                        : '5 - Could Teach It'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {([1, 2, 3, 4, 5] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleConfidenceChange(star)}
                className={`flex-1 h-9 rounded-xl border flex items-center justify-center font-bold text-xs font-mono transition-all ${
                  star <= confidence
                    ? 'text-black font-bold'
                    : 'border-border/60 bg-surface-2/40 text-muted-foreground hover:text-foreground'
                }`}
                style={{
                  backgroundColor: star <= confidence ? accentColor : undefined,
                  borderColor: star <= confidence ? accentColor : undefined,
                }}
              >
                {star}
              </button>
            ))}
          </div>
        </div>

        {/* Key Idea Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Key Idea (One-liner summary)
          </label>
          <input
            type="text"
            value={keyIdeaDraft}
            onChange={(e) => {
              setKeyIdeaDraft(e.target.value);
              updateItemProgress(itemId, { keyIdea: e.target.value });
            }}
            placeholder="e.g. Invert binary tree using post-order DFS swap"
            className="w-full bg-surface-2/50 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
          />
        </div>

        {/* Mistakes I Made */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Mistakes I Made (For future revision)
          </label>
          <textarea
            rows={2}
            value={mistakesDraft}
            onChange={(e) => {
              setMistakesDraft(e.target.value);
              updateItemProgress(itemId, { mistakes: e.target.value });
            }}
            placeholder="e.g. Forgot null check for single-node edge case"
            className="w-full bg-surface-2/50 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 resize-none"
          />
        </div>

        {/* Notes (Markdown, up to 20k chars) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">
              Notes (Markdown)
            </span>
            <span className="font-mono text-[10px]">
              {notesDraft.length} / 20,000 chars
            </span>
          </div>
          <textarea
            rows={6}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Write your study notes, Java code snippets, or thoughts here..."
            className="w-full bg-surface-2/50 border border-border rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 font-mono leading-relaxed"
          />
        </div>

        {/* Reference Links */}
        <div className="space-y-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Reference Links
          </label>

          {/* Video Link */}
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-muted-foreground flex-none" />
            <input
              type="url"
              value={videoUrlDraft}
              onChange={(e) => setVideoUrlDraft(e.target.value)}
              onBlur={handleSaveLinks}
              placeholder="Video URL (https://...)"
              className="flex-1 bg-surface-2/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
            />
            {videoUrlDraft.startsWith('http') && (
              <a
                href={videoUrlDraft}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Article Link */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground flex-none" />
            <input
              type="url"
              value={articleUrlDraft}
              onChange={(e) => setArticleUrlDraft(e.target.value)}
              onBlur={handleSaveLinks}
              placeholder="Article URL (https://...)"
              className="flex-1 bg-surface-2/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
            />
            {articleUrlDraft.startsWith('http') && (
              <a
                href={articleUrlDraft}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Practice Problem Link */}
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-muted-foreground flex-none" />
            <input
              type="url"
              value={practiceUrlDraft}
              onChange={(e) => setPracticeUrlDraft(e.target.value)}
              onBlur={handleSaveLinks}
              placeholder="Practice Problem URL (https://...)"
              className="flex-1 bg-surface-2/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
            />
            {practiceUrlDraft.startsWith('http') && (
              <a
                href={practiceUrlDraft}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Time & Attempts Strip */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
          <div className="bg-surface-2/30 border border-border rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5" /> Time Spent
              </span>
              <span className="font-mono font-bold text-foreground">
                {minutes} min
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                isTimerRunning
                  ? 'bg-danger/20 text-danger border border-danger/40'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Timer</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-surface-2/30 border border-border rounded-xl p-3 flex flex-col justify-between">
            <span className="text-muted-foreground text-[11px] block">
              Attempts Count
            </span>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() =>
                  updateItemProgress(itemId, {
                    attempts: Math.max(0, attempts - 1),
                  })
                }
                className="w-7 h-7 rounded-lg border border-border bg-surface-2 text-foreground flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="font-mono font-bold text-sm text-foreground">
                {attempts}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateItemProgress(itemId, {
                    attempts: attempts + 1,
                  })
                }
                className="w-7 h-7 rounded-lg border border-border bg-surface-2 text-foreground flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-border bg-surface-2/40 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => toggleBookmark(itemId)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors ${
            isBookmarked
              ? 'bg-warning/10 border-warning/40 text-warning'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-warning' : ''}`} />
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </button>

        <button
          type="button"
          onClick={() => toggleHideItem(itemId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>{isHidden ? 'Unhide Item' : 'Hide Item'}</span>
        </button>
      </div>
    </aside>
  );
};

export const ItemDetailDrawer: React.FC = () => {
  const { selectedItemId, setSelectedItemId } = useSheetStore();

  if (!selectedItemId) return null;

  return (
    <>
      <div
        onClick={() => setSelectedItemId(null)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
      />
      <ItemDetailContent
        key={selectedItemId}
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
};
