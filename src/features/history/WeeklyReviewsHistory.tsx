import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle,
  Sparkles,
  Target,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';
import { WeeklyReview } from '@/types/sheet';
import {
  loadLocalWeeklyReviews,
  fetchRemoteWeeklyReviews,
} from '@/lib/weeklyReviewStorage';
import { WeeklyReviewDialog } from '@/components/weekly-review/WeeklyReviewDialog';
import { useAuthStore } from '@/stores/useAuthStore';

export const WeeklyReviewsHistory: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<Record<string, WeeklyReview>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const refreshReviews = useCallback(() => {
    const local = loadLocalWeeklyReviews();
    setReviews(local);
    if (user?.uid) {
      fetchRemoteWeeklyReviews(user.uid).then(setReviews);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshReviews]);

  const sortedReviews = Object.values(reviews).sort((a, b) =>
    b.isoWeek.localeCompare(a.isoWeek)
  );

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Weekly Reflections & Reviews</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Saved weekly checkups, goals, and reflections under users/{'{uid}'}/weeks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Weekly Review</span>
        </button>
      </div>

      {sortedReviews.length === 0 ? (
        <div className="p-6 rounded-2xl bg-surface-2/30 border border-dashed border-border/80 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            No weekly reviews recorded yet. You can complete a checkup anytime or on Sundays to review your reps.
          </p>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            Start your first weekly review →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map((rev) => {
            const isExpanded = expandedWeek === rev.isoWeek;
            return (
              <div
                key={rev.isoWeek}
                className="p-4 rounded-2xl border border-border/80 bg-surface-2/30 hover:bg-surface-2/50 transition-colors space-y-3"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedWeek(isExpanded ? null : rev.isoWeek)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {rev.isoWeek}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {rev.stats.completedCount} completed · {rev.stats.revisedCount} revised · {rev.stats.activeDays} active days
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-[11px] font-mono hidden sm:inline">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fade-rise">
                    <div className="p-3 rounded-xl bg-surface border border-border/60 space-y-1">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> What Went Well
                      </span>
                      <p className="text-foreground/90 leading-relaxed">{rev.wentWell}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-border/60 space-y-1">
                      <span className="font-semibold text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" /> Challenges & Hard
                      </span>
                      <p className="text-foreground/90 leading-relaxed">{rev.hard}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-border/60 space-y-1">
                      <span className="font-semibold text-primary flex items-center gap-1 font-mono text-[11px]">
                        <Target className="w-3.5 h-3.5" /> Next Goal
                      </span>
                      <p className="text-foreground/90 leading-relaxed">{rev.nextGoal}</p>
                      {rev.targetItems && (
                        <p className="text-[10px] text-muted-foreground font-mono pt-1">
                          Target: {rev.targetItems} items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Review Dialog */}
      <WeeklyReviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaved={refreshReviews}
      />
    </div>
  );
};
