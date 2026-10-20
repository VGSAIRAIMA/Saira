import React from 'react';
import { Subtopic, PracticeItem, CustomItem, ItemProgress } from '@/types/sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  Check,
  Star,
  FileText,
  Video,
  BookOpen,
  Code,
  Clock,
} from 'lucide-react';

interface ItemRowProps {
  item: Subtopic | PracticeItem | CustomItem;
  kind: 'subtopic' | 'practice';
  topicId: string;
  phaseOrder: number;
  isFocused?: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  kind,
  phaseOrder,
  isFocused = false,
}) => {
  const {
    progress,
    selectedItemId,
    toggleItemDone,
    toggleBookmark,
    setSelectedItemId,
  } = useSheetStore();

  const itemProgress: ItemProgress | undefined = progress[item.id];
  const isDone = itemProgress?.status === 'done';
  const isBookmarked = !!itemProgress?.bookmarked;
  const confidence = itemProgress?.confidence || 0;
  const hasNotes = !!itemProgress?.notes?.trim();
  const accentColor = `var(--ph${phaseOrder})`;

  const isCandidate =
    kind === 'practice' &&
    'verified' in item &&
    item.verified === false;

  const sources = 'sources' in item && item.sources ? item.sources : [];
  const displayTitle = itemProgress?.titleOverride || item.title;

  const links = itemProgress?.links || ('links' in item ? item.links : undefined);
  const hasVideo = !!links?.video;
  const hasArticle = !!links?.article;
  const hasPractice = !!links?.practice;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItemDone(item.id, displayTitle);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(item.id);
  };

  const isSelected = selectedItemId === item.id;

  return (
    <div
      id={`item-${item.id}`}
      onClick={() => setSelectedItemId(item.id)}
      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
        isSelected
          ? 'bg-surface-2 border-primary/50 shadow-xs'
          : isFocused
            ? 'bg-surface-2/60 border-primary/40 ring-1 ring-primary/30'
            : 'border-transparent hover:bg-surface-2/40 hover:border-border/60'
      }`}
    >
      {/* Left: Checkbox + Title + Chips */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          type="button"
          aria-label={isDone ? `Mark ${displayTitle} as not started` : `Mark ${displayTitle} as done`}
          onClick={handleCheckboxClick}
          className={`w-5 h-5 flex-none rounded-md border flex items-center justify-center transition-all ${
            isDone
              ? 'border-transparent text-black font-bold'
              : 'border-border/80 hover:border-border bg-surface'
          }`}
          style={{
            backgroundColor: isDone ? accentColor : undefined,
          }}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Title & Key Idea */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs sm:text-[13px] font-medium leading-snug transition-colors ${
                isDone
                  ? 'text-muted-foreground line-through decoration-border/80'
                  : 'text-foreground group-hover:text-foreground'
              }`}
            >
              {displayTitle}
            </span>

            {/* Candidate Badge */}
            {isCandidate && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border border-[#4a3a1c] text-[#e6bd6b] bg-[#4a3a1c]/20">
                candidate
              </span>
            )}

            {/* Source Tags */}
            {sources.map((src) => (
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
          </div>

          {/* Key Idea snippet if present */}
          {itemProgress?.keyIdea && (
            <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5 font-sans">
              💡 {itemProgress.keyIdea}
            </p>
          )}
        </div>
      </div>

      {/* Right: Metadata Indicators & Actions */}
      <div className="flex items-center gap-2 flex-none text-muted-foreground text-xs">
        {/* Revision Due Pill */}
        {itemProgress?.revision?.dueDayKey && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-border bg-surface-2 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{itemProgress.revision.dueDayKey}</span>
          </span>
        )}

        {/* External Link Icons */}
        <div className="hidden md:flex items-center gap-1.5 opacity-70 group-hover:opacity-100">
          {hasVideo && (
            <a
              href={links?.video}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-primary transition-colors"
              title="Watch Video"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
          )}
          {hasArticle && (
            <a
              href={links?.article}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-primary transition-colors"
              title="Read Article"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </a>
          )}
          {hasPractice && (
            <a
              href={links?.practice}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-primary transition-colors"
              title="Practice Problem"
            >
              <Code className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Notes Indicator */}
        {hasNotes && (
          <span title="Has Notes">
            <FileText className="w-3.5 h-3.5 text-primary/80" />
          </span>
        )}

        {/* Confidence Dots (1-5) */}
        <div className="hidden sm:flex items-center gap-0.5" title={`Confidence: ${confidence}/5`}>
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{
                backgroundColor:
                  dot <= confidence
                    ? accentColor
                    : 'hsl(var(--surface-2))',
              }}
            />
          ))}
        </div>

        {/* Bookmark Star */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark item'}
          className={`p-1 rounded-md transition-colors ${
            isBookmarked
              ? 'text-warning'
              : 'opacity-40 hover:opacity-100 hover:text-foreground'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-warning' : ''}`} />
        </button>
      </div>
    </div>
  );
};
