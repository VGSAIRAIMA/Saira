import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';

import { TodayTargetRing } from './components/TodayTargetRing';
import { QuoteCard } from './components/QuoteCard';
import { ContinueCard } from './components/ContinueCard';
import { WeekStrip } from './components/WeekStrip';
import { MilestoneBanner } from './components/MilestoneBanner';

export const TodayPage: React.FC = () => {
  const isLoaded = useSheetStore((s) => s.isLoaded);
  const user = useAuthStore((s) => s.user);
  const progress = useSheetStore((s) => s.progress);
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

  const learnerName = user?.displayName ? user.displayName.split(' ')[0] : 'Learner';

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Count items currently due for revision
  const revisionDueCount = useMemo(() => {
    if (!isLoaded) return 0;
    let count = 0;
    for (const p of Object.values(progress)) {
      if (p.revision?.dueDayKey && p.revision.dueDayKey <= todayKey && p.status === 'done') {
        count++;
      }
    }
    return count;
  }, [progress, todayKey, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="space-y-8 animate-pulse pb-12" aria-busy="true" aria-label="Loading today's dashboard">
        {/* Greeting Header Skeleton */}
        <div className="space-y-2">
          <div className="h-10 w-52 bg-surface-2 rounded-2xl" />
          <div className="h-4 w-72 bg-surface-2/60 rounded-xl" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-surface border border-border/50 rounded-3xl p-7 flex flex-col justify-between">
            <div className="h-5 w-32 bg-surface-2 rounded-full" />
            <div className="space-y-3">
              <div className="h-7 w-5/6 bg-surface-2 rounded-xl" />
              <div className="h-7 w-3/5 bg-surface-2/60 rounded-xl" />
            </div>
            <div className="h-4 w-28 bg-surface-2/40 rounded-lg" />
          </div>

          <div className="h-64 bg-surface border border-border/50 rounded-3xl p-7 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-surface-2 rounded-lg" />
              <div className="h-4 w-16 bg-surface-2/60 rounded-lg" />
            </div>
            <div className="flex items-center gap-5 my-2">
              <div className="w-24 h-24 rounded-full border-4 border-surface-2 bg-surface-2/20 shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="h-4 w-3/4 bg-surface-2 rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-2/60 rounded-lg" />
              </div>
            </div>
            <div className="h-4 w-full bg-surface-2/40 rounded-lg" />
          </div>
        </div>

        {/* Continue Learning Card Skeleton */}
        <div className="h-32 bg-surface border border-border/50 rounded-3xl p-7 flex items-center justify-between">
          <div className="space-y-2.5">
            <div className="h-4 w-36 bg-surface-2 rounded-full" />
            <div className="h-6 w-64 bg-surface-2 rounded-xl" />
            <div className="h-3.5 w-48 bg-surface-2/60 rounded-lg" />
          </div>
          <div className="h-11 w-36 bg-surface-2 rounded-2xl" />
        </div>

        {/* Week Strip Skeleton */}
        <div className="bg-surface border border-border/50 rounded-3xl p-7 space-y-5">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-surface-2 rounded-lg" />
            <div className="h-5 w-28 bg-surface-2/60 rounded-full" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-surface-2/30 border border-border/30 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-rise pb-12">
      {/* Greeting Header */}
      <div className="space-y-1">
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
          {greeting}, {learnerName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s build consistency today. Step by step, item by item.
        </p>
      </div>

      {/* Milestone celebration banner (streak & phase completions) */}
      <MilestoneBanner />

      {/* Main Grid: Quote Card (2 cols) & Today's Target Ring (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuoteCard />
        <TodayTargetRing />
      </div>

      {/* Continue Learning Card */}
      <ContinueCard />

      {/* Spaced Revision Notice (if items due) */}
      {revisionDueCount > 0 && (
        <div className="bg-surface border border-accent-pink/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-accent-pink/5 via-surface to-transparent shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center text-accent-pink shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {revisionDueCount} {revisionDueCount === 1 ? 'item' : 'items'} due for spaced recall
              </h4>
              <p className="text-xs text-muted-foreground">
                Strengthen long-term retention before moving deep into new topics.
              </p>
            </div>
          </div>
          <Link
            to="/revision"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-surface-2 text-foreground hover:bg-surface-2/80 transition-colors self-start sm:self-auto shrink-0 border border-border"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Habits / Last 7 Days Consistency Strip */}
      <WeekStrip />
    </div>
  );
};
