import React from 'react';
import { CheckCircle2, TrendingUp, Calendar, Target } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { allPhases } from '@/lib/seed';
import { getDayKey, parseDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import {
  calculateOverallCompletion,
  calculatePace,
  calculateProjectedFinish,
  calculateConsistency30,
} from '@/lib/stats';

export const StatCards: React.FC = () => {
  const progress = useSheetStore((s) => s.progress);
  const hiddenIds = useSheetStore((s) => s.hiddenIds);
  const dayLogs = useSheetStore((s) => s.dayLogs);

  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

  // 1. Overall Completion
  const completion = calculateOverallCompletion(allPhases, progress, hiddenIds);
  const remainingItems = completion.total - completion.completed;

  // 2. Pace (14-day rolling window)
  const pace = calculatePace(dayLogs, todayKey, 14);

  // 3. Consistency (last 30 days)
  const consistency = calculateConsistency30(dayLogs, todayKey);
  const activeDays30 = Math.round(consistency * 30);

  // 4. Projected Finish
  const projectedDateKey = calculateProjectedFinish(todayKey, remainingItems, pace);

  let projectedDisplay = '—';
  let projectedSubtext = 'Requires active pace';

  if (remainingItems <= 0) {
    projectedDisplay = 'Done!';
    projectedSubtext = 'Curriculum completed';
  } else if (projectedDateKey) {
    const projDate = parseDayKey(projectedDateKey);
    projectedDisplay = projDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const daysRemaining = Math.ceil(remainingItems / pace);
    projectedSubtext = `~${daysRemaining} study ${daysRemaining === 1 ? 'day' : 'days'} at current pace`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Overall Completion */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Overall Completion
          </span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-3xl font-display font-medium text-foreground tracking-tight">
            {completion.percentage}%
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {completion.completed} of {completion.total} items done
          </span>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completion.percentage)}%` }}
          />
        </div>
      </div>

      {/* 2. 14-Day Pace */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            14-Day Study Pace
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-3xl font-display font-medium text-foreground tracking-tight">
            {pace > 0 ? pace.toFixed(1) : '0.0'}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {pace > 0 ? 'items / active day' : 'No reps in last 14 days'}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Rolling 14-day velocity
        </div>
      </div>

      {/* 3. 30-Day Consistency */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            30-Day Consistency
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-3xl font-display font-medium text-foreground tracking-tight">
            {Math.round(consistency * 100)}%
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {activeDays30} of 30 active days
          </span>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round(consistency * 100))}%` }}
          />
        </div>
      </div>

      {/* 4. Projected Finish */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Projected Finish
          </span>
          <div className="w-8 h-8 rounded-xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center text-accent-pink">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-2xl font-display font-medium text-foreground tracking-tight truncate">
            {projectedDisplay}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {projectedSubtext}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">
          {remainingItems} {remainingItems === 1 ? 'item' : 'items'} remaining
        </div>
      </div>
    </div>
  );
};
