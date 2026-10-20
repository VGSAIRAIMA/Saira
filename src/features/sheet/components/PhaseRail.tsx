import React from 'react';
import { allPhases } from '@/lib/seed';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  calculatePhaseCompletion,
  calculateOverallCompletion,
} from '@/lib/stats/completion';

export const PhaseRail: React.FC = () => {
  const {
    progress,
    hiddenIds,
    countMode,
    selectedPhaseId,
    setSelectedPhaseId,
  } = useSheetStore();

  const overall = calculateOverallCompletion(
    allPhases,
    progress,
    hiddenIds,
    countMode
  );

  return (
    <aside className="space-y-4">
      {/* Overall Progress Ring Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
        <div className="relative w-14 h-14 flex-none">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface-2"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="transition-all duration-500 ease-out"
              stroke="url(#brand-ring-grad)"
              strokeDasharray={`${overall.percentage}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <defs>
              <linearGradient id="brand-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B3DFF" />
                <stop offset="100%" stopColor="#FF2E7E" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-foreground">
            {Math.round(overall.percentage)}%
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Overall Sheet
          </span>
          <span className="text-sm font-medium text-foreground block truncate">
            {overall.completed} / {overall.total} items
          </span>
          {overall.hiddenCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {overall.hiddenCount} hidden
            </span>
          )}
        </div>
      </div>

      {/* Six Phase Cards */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
          Phases
        </div>

        {allPhases.map((phase, idx) => {
          const isSelected = phase.id === selectedPhaseId;
          const stats = calculatePhaseCompletion(
            phase,
            progress,
            hiddenIds,
            countMode
          );
          const accentColor = `var(--ph${idx})`;

          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                isSelected
                  ? 'bg-surface border-border shadow-xs'
                  : 'border-transparent hover:bg-surface/50 hover:border-border/30'
              }`}
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: accentColor,
              }}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium text-xs text-foreground line-clamp-1 leading-snug">
                  {phase.order}. {phase.title}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground flex-none">
                  {stats.percentage}%
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span className="font-mono">
                  {stats.completed}/{stats.total}
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  {phase.topics.length} topics
                </span>
              </div>

              {/* Thin Phase Progress Bar */}
              <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.percentage}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
