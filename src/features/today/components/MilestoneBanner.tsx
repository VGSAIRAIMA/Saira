import React, { useState } from 'react';
import { Trophy, Flame, X } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { calculateStreak } from '@/lib/stats/streak';
import { calculatePhaseCompletion } from '@/lib/stats/completion';
import { allPhases } from '@/lib/seed';
import { getMilestoneQuote } from '@/lib/quotes';

interface MilestoneInfo {
  key: string;
  type: 'streak' | 'phase';
  title: string;
  subtitle: string;
}

export const MilestoneBanner: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const progress = useSheetStore((s) => s.progress);
  const hiddenIds = useSheetStore((s) => s.hiddenIds);

  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('saira_dismissed_milestones');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const streak = calculateStreak(dayLogs);
  const currentStreak = streak.currentStreak;

  // 1. Check streak milestones (thresholds: 100, 50, 30, 14, 7, 3)
  const streakMilestones = [100, 50, 30, 14, 7, 3];
  let activeMilestone: MilestoneInfo | null = null;

  for (const threshold of streakMilestones) {
    if (currentStreak >= threshold) {
      const key = `streak_${threshold}`;
      if (!dismissedKeys.has(key)) {
        activeMilestone = {
          key,
          type: 'streak',
          title: `🔥 ${threshold}-Day Streak Achieved!`,
          subtitle: `You've shown up for ${threshold} consecutive days. Your dedication is compounding.`,
        };
        break;
      }
    }
  }

  // 2. Check phase milestones if no streak milestone is active
  if (!activeMilestone) {
    for (const phase of allPhases) {
      const phaseStats = calculatePhaseCompletion(phase, progress, hiddenIds);
      if (phaseStats.total > 0 && phaseStats.percentage === 100) {
        const key = `phase_${phase.id}_done`;
        if (!dismissedKeys.has(key)) {
          activeMilestone = {
            key,
            type: 'phase',
            title: `🏆 Phase ${phase.order}: ${phase.title} Mastered!`,
            subtitle: `You have completed all ${phaseStats.completed} items in this phase!`,
          };
          break;
        }
      }
    }
  }

  if (!activeMilestone) {
    return null;
  }

  const milestoneQuote = getMilestoneQuote(currentStreak);

  const handleDismiss = () => {
    if (!activeMilestone) return;
    const nextDismissed = new Set(dismissedKeys);
    nextDismissed.add(activeMilestone.key);
    setDismissedKeys(nextDismissed);
    try {
      sessionStorage.setItem('saira_dismissed_milestones', JSON.stringify(Array.from(nextDismissed)));
    } catch {
      // sessionStorage unavailable
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-primary/30 bg-gradient-to-r from-primary/15 via-surface to-accent-pink/15 shadow-md animate-fade-rise">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            {activeMilestone.type === 'streak' ? (
              <Flame className="w-6 h-6 fill-primary text-primary" />
            ) : (
              <Trophy className="w-6 h-6 text-accent-pink" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                Milestone Celebration
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {activeMilestone.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {activeMilestone.subtitle}
            </p>
            <blockquote className="font-display text-base sm:text-lg text-foreground/90 italic pt-2">
              &ldquo;{milestoneQuote.text}&rdquo;
            </blockquote>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss milestone banner"
          aria-label="Dismiss milestone banner"
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
