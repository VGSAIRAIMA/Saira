import React from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import { allPhases } from '@/lib/seed';

interface ConfidenceTier {
  level: number | 'unrated';
  label: string;
  sublabel: string;
  color: string;
  barColor: string;
  count: number;
  percentage: number;
}

export const ConfidenceDistribution: React.FC = () => {
  const progress = useSheetStore((s) => s.progress);
  const hiddenIds = useSheetStore((s) => s.hiddenIds);

  // Collect all completed, non-hidden items
  const counts: Record<number | 'unrated', number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
    unrated: 0,
  };

  let totalCompleted = 0;

  for (const phase of allPhases) {
    for (const topic of phase.topics) {
      for (const item of [...(topic.subtopics || []), ...(topic.practice || [])]) {
        if (hiddenIds.has(item.id)) continue;
        const p = progress[item.id];
        if (p && p.status === 'done') {
          totalCompleted++;
          const conf = p.confidence;
          if (conf && conf >= 1 && conf <= 5) {
            counts[conf]++;
          } else {
            counts['unrated']++;
          }
        }
      }
    }
  }

  const tiers: ConfidenceTier[] = [
    {
      level: 5,
      label: '5 · Mastered',
      sublabel: 'Could teach this cold',
      color: 'text-emerald-400',
      barColor: 'bg-emerald-400',
      count: counts[5],
      percentage: totalCompleted > 0 ? Math.round((counts[5] / totalCompleted) * 100) : 0,
    },
    {
      level: 4,
      label: '4 · Strong',
      sublabel: 'Comfortable with nuances',
      color: 'text-sky-400',
      barColor: 'bg-sky-400',
      count: counts[4],
      percentage: totalCompleted > 0 ? Math.round((counts[4] / totalCompleted) * 100) : 0,
    },
    {
      level: 3,
      label: '3 · Solid',
      sublabel: 'Solved with some thought',
      color: 'text-primary',
      barColor: 'bg-primary',
      count: counts[3],
      percentage: totalCompleted > 0 ? Math.round((counts[3] / totalCompleted) * 100) : 0,
    },
    {
      level: 2,
      label: '2 · Shaky',
      sublabel: 'Needed hints or nudges',
      color: 'text-amber-400',
      barColor: 'bg-amber-400',
      count: counts[2],
      percentage: totalCompleted > 0 ? Math.round((counts[2] / totalCompleted) * 100) : 0,
    },
    {
      level: 1,
      label: '1 · Struggling',
      sublabel: 'Heavy friction; redo needed',
      color: 'text-rose-400',
      barColor: 'bg-rose-400',
      count: counts[1],
      percentage: totalCompleted > 0 ? Math.round((counts[1] / totalCompleted) * 100) : 0,
    },
    {
      level: 'unrated',
      label: 'Unrated',
      sublabel: 'No confidence score recorded',
      color: 'text-muted-foreground',
      barColor: 'bg-muted-foreground/50',
      count: counts['unrated'],
      percentage: totalCompleted > 0 ? Math.round((counts['unrated'] / totalCompleted) * 100) : 0,
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Confidence Distribution</h2>
          <p className="text-xs text-muted-foreground">
            Breakdown of your self-assessed confidence across all completed items.
          </p>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          {totalCompleted} {totalCompleted === 1 ? 'item' : 'items'} rated
        </span>
      </div>

      {totalCompleted === 0 ? (
        <div className="h-44 rounded-2xl border border-dashed border-border bg-surface-2/20 flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground/80 mb-1">No Completed Items to Rate</p>
          <p className="max-w-xs">
            Rate your confidence (1–5) in the item drawer when marking items done to build your mastery distribution.
          </p>
        </div>
      ) : (
        <>
          {/* Stacked bar visualization */}
          <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden flex border border-border/40">
            {tiers.map((tier) =>
              tier.count > 0 ? (
                <div
                  key={String(tier.level)}
                  className={`${tier.barColor} h-full transition-all duration-500`}
                  style={{ width: `${(tier.count / totalCompleted) * 100}%` }}
                  title={`${tier.label}: ${tier.count} items (${tier.percentage}%)`}
                />
              ) : null
            )}
          </div>

          {/* Detailed breakdown list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {tiers.map((tier) => (
              <div
                key={String(tier.level)}
                className="p-3.5 rounded-2xl bg-surface-2/40 border border-border flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tier.barColor}`} />
                    <span className="font-semibold text-xs text-foreground">{tier.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">{tier.sublabel}</span>
                </div>

                <div className="text-right font-mono">
                  <div className={`text-sm font-semibold ${tier.color}`}>{tier.count}</div>
                  <div className="text-[10px] text-muted-foreground">{tier.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
