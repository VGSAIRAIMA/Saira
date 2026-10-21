import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Sparkles,
  X,
  Target,
  Send,
} from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { getIsoWeekKey, getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import {
  computeWeeklyStats,
  saveWeeklyReview,
  loadLocalWeeklyReviews,
} from '@/lib/weeklyReviewStorage';
import { WeeklyReview } from '@/types/sheet';

interface WeeklyReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (review: WeeklyReview) => void;
  targetIsoWeek?: string;
}

export const WeeklyReviewDialog: React.FC<WeeklyReviewDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  targetIsoWeek,
}) => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const progress = useSheetStore((s) => s.progress);
  const dailyTarget = useSheetStore((s) => s.dailyTarget);

  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const currentIsoWeek = targetIsoWeek || getIsoWeekKey(todayKey);

  const stats = useMemo(() => {
    return computeWeeklyStats(currentIsoWeek, dayLogs, progress);
  }, [currentIsoWeek, dayLogs, progress]);

  const [wentWell, setWentWell] = useState('');
  const [hard, setHard] = useState('');
  const [nextGoal, setNextGoal] = useState('');
  const [nextWeekTarget, setNextWeekTarget] = useState<number>(dailyTarget * 5);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill existing review if one already exists for this week
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const existingReviews = loadLocalWeeklyReviews();
      const existing = existingReviews[currentIsoWeek];
      if (existing) {
        setWentWell(existing.wentWell || '');
        setHard(existing.hard || '');
        setNextGoal(existing.nextGoal || '');
        if (existing.targetItems) setNextWeekTarget(existing.targetItems);
      } else {
        setWentWell('');
        setHard('');
        setNextGoal('');
        setNextWeekTarget(dailyTarget * 5);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, currentIsoWeek, dailyTarget]);

  // Accessibility: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const review: WeeklyReview = {
      isoWeek: currentIsoWeek,
      wentWell: wentWell.trim(),
      hard: hard.trim(),
      nextGoal: nextGoal.trim(),
      targetItems: nextWeekTarget,
      stats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveWeeklyReview(review);
    setIsSaving(false);
    onSaved?.(review);
    onClose();
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Weekly Reflection & Planning"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto animate-fade-rise">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          aria-label="Close Weekly Review"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/30">
              {currentIsoWeek}
            </span>
            <span className="text-xs text-muted-foreground font-mono">Sunday Checkup</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-foreground">
            Weekly Review & Reset
          </h2>
          <p className="text-xs text-muted-foreground">
            Honest reflection builds deliberate mastery. Take 3 minutes to look back and plan ahead.
          </p>
        </div>

        {/* This Week's Computed Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/60">
            <span className="text-[10px] font-mono text-muted-foreground block">Completed</span>
            <span className="text-xl font-bold text-foreground mt-0.5 block">
              {stats.completedCount}
            </span>
            <span className="text-[10px] text-muted-foreground">problems</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/60">
            <span className="text-[10px] font-mono text-muted-foreground block">Revised</span>
            <span className="text-xl font-bold text-foreground mt-0.5 block">
              {stats.revisedCount}
            </span>
            <span className="text-[10px] text-muted-foreground">reviews</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/60">
            <span className="text-[10px] font-mono text-muted-foreground block">Active Days</span>
            <span className="text-xl font-bold text-foreground mt-0.5 block">
              {stats.activeDays} / 7
            </span>
            <span className="text-[10px] text-muted-foreground">streak days</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-2/40 border border-border/60">
            <span className="text-[10px] font-mono text-muted-foreground block">Total Time</span>
            <span className="text-xl font-bold text-foreground mt-0.5 block">
              {stats.totalMinutes}m
            </span>
            <span className="text-[10px] text-muted-foreground">focused</span>
          </div>
        </div>

        {/* Reflection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What went well */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>What went well this week?</span>
            </label>
            <textarea
              rows={2}
              required
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g. Mastered binary search variations, stayed consistent with 4 active days..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-2/60 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-none"
            />
          </div>

          {/* What was hard */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>What was challenging or hard?</span>
            </label>
            <textarea
              rows={2}
              required
              value={hard}
              onChange={(e) => setHard(e.target.value)}
              placeholder="e.g. Dynamic programming state transitions felt tricky, needed hints on 2 problems..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-2/60 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Next Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span>Main goal or focus for next week</span>
            </label>
            <textarea
              rows={2}
              required
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
              placeholder="e.g. Complete Phase 1 Trees and keep zero revision cards overdue..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-2/60 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Target Items for Next Week */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-2/40 border border-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block">
                Target Problems Next Week
              </span>
              <span className="text-[10px] text-muted-foreground">
                Based on your daily target of {dailyTarget} items/day.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={nextWeekTarget}
                onChange={(e) => setNextWeekTarget(parseInt(e.target.value, 10) || 10)}
                className="w-16 px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs font-mono text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground font-mono">items</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={isSaving || !wentWell.trim() || !hard.trim() || !nextGoal.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Weekly Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
