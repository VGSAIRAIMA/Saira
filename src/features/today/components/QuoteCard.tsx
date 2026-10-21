import React, { useState } from 'react';
import { Heart, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { getDailyQuote } from '@/lib/quotes';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import { useSheetStore } from '@/stores/useSheetStore';

const CATEGORY_LABELS: Record<string, string> = {
  start: 'Getting Started',
  consistency: 'Daily Consistency',
  struggle: 'Pushing Through',
  comeback: 'Resilience & Comeback',
  milestone: 'Milestone Celebration',
  revision: 'Spaced Memory',
};

export const QuoteCard: React.FC = () => {
  const favoriteQuoteIds = useSheetStore((s) => s.favoriteQuoteIds);
  const toggleFavoriteQuote = useSheetStore((s) => s.toggleFavoriteQuote);

  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const [shift, setShift] = useState(0);
  const [copied, setCopied] = useState(false);

  const quote = getDailyQuote(todayKey, shift);
  const isFavorite = favoriteQuoteIds.has(quote.id);
  const categoryLabel = CATEGORY_LABELS[quote.cat] || 'Daily Motivation';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`“${quote.text}” — SAIRA`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNextQuote = () => {
    setShift((prev) => prev + 1);
  };

  const handleToggleFavorite = async () => {
    await toggleFavoriteQuote(quote.id);
  };

  return (
    <div className="relative md:col-span-2 rounded-3xl p-6 sm:p-8 bg-surface border border-border overflow-hidden flex flex-col justify-between min-h-[240px] shadow-sm group">
      {/* Subtle brand gradient background tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-pink/5 pointer-events-none" />

      {/* Top bar with category and action buttons */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3 h-3" />
          {categoryLabel}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'text-accent-pink fill-accent-pink' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleNextQuote}
            title="Another quote"
            aria-label="Another quote"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 transition-transform active:rotate-180" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy quote"
            aria-label="Copy quote"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Quote Body in Instrument Serif */}
      <div className="relative z-10 my-auto py-2">
        <blockquote className="font-display text-2xl sm:text-[28px] text-foreground leading-snug tracking-tight">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
      </div>

      {/* Author & Footer */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">SAIRA Mindset</span>
        {shift > 0 ? (
          <span className="text-[11px] text-muted-foreground/70 italic">Rotated quote (#{quote.id})</span>
        ) : (
          <span className="text-[11px] text-muted-foreground/70">Daily stable quote</span>
        )}
      </div>
    </div>
  );
};
