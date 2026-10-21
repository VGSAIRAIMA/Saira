import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { allPhases } from '@/lib/seed';
import { calculatePhaseCompletion } from '@/lib/stats/completion';

const PHASE_STYLES: Record<number, { bg: string; text: string; bar: string; border: string }> = {
  0: { bg: 'bg-ph-0/10', text: 'text-ph-0', bar: 'bg-ph-0', border: 'border-ph-0/30' },
  1: { bg: 'bg-ph-1/10', text: 'text-ph-1', bar: 'bg-ph-1', border: 'border-ph-1/30' },
  2: { bg: 'bg-ph-2/10', text: 'text-ph-2', bar: 'bg-ph-2', border: 'border-ph-2/30' },
  3: { bg: 'bg-ph-3/10', text: 'text-ph-3', bar: 'bg-ph-3', border: 'border-ph-3/30' },
  4: { bg: 'bg-ph-4/10', text: 'text-ph-4', bar: 'bg-ph-4', border: 'border-ph-4/30' },
  5: { bg: 'bg-ph-5/10', text: 'text-ph-5', bar: 'bg-ph-5', border: 'border-ph-5/30' },
};

export const PhaseBars: React.FC = () => {
  const progress = useSheetStore((s) => s.progress);
  const hiddenIds = useSheetStore((s) => s.hiddenIds);

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Phase Breakdown</h2>
          <p className="text-xs text-muted-foreground">
            Curriculum progression across all 6 sequential learning phases.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {allPhases.map((phase) => {
          const stats = calculatePhaseCompletion(phase, progress, hiddenIds);
          const style = PHASE_STYLES[phase.order] || PHASE_STYLES[0];

          return (
            <Link
              key={phase.id}
              to={`/sheet/${phase.id}`}
              className="block p-4 sm:p-5 rounded-2xl bg-surface-2/40 border border-border hover:border-border/80 hover:bg-surface-2/70 transition-all group"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${style.bg} ${style.text} border ${style.border} shrink-0`}
                  >
                    Phase {phase.order}
                  </span>
                  <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {phase.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-semibold font-mono text-foreground">
                      {stats.percentage}%
                    </span>
                    <span className="block text-[11px] font-mono text-muted-foreground">
                      {stats.completed} / {stats.total}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/30">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${style.bar}`}
                  style={{ width: `${Math.min(100, stats.percentage)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
