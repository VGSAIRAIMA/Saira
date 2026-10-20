import React from 'react';
import { Phase } from '@/types/sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import { calculatePhaseCompletion } from '@/lib/stats/completion';
import { EyeOff, Plus, Play } from 'lucide-react';

interface PhaseHeaderProps {
  phase: Phase;
  onOpenAddModal: () => void;
  onOpenHiddenModal: () => void;
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({
  phase,
  onOpenAddModal,
  onOpenHiddenModal,
}) => {
  const {
    progress,
    hiddenIds,
    countMode,
    setCountMode,
    getContinueItemId,
    setSelectedItemId,
  } = useSheetStore();

  const stats = calculatePhaseCompletion(phase, progress, hiddenIds, countMode);
  const accentColor = `var(--ph${phase.order})`;

  const handleContinue = () => {
    const nextId = getContinueItemId();
    if (nextId) {
      setSelectedItemId(nextId);
      const element = document.getElementById(`item-${nextId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
      {/* Top Banner: Info + Big Progress Ring */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/70">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                color: accentColor,
              }}
            >
              Phase {phase.order}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {stats.completed} of {stats.total} completed
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-foreground font-medium">
            {phase.title}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {phase.description}
          </p>
        </div>

        {/* Big Ring + Continue */}
        <div className="flex items-center gap-6 flex-none self-start sm:self-auto">
          <div className="relative w-20 h-20 flex-none">
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
                stroke={accentColor}
                strokeDasharray={`${stats.percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-none">
              <span className="font-bold text-base text-foreground">
                {Math.round(stats.percentage)}%
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">done</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Continue</span>
            </button>
            <div className="text-[11px] text-muted-foreground font-mono">
              {stats.total - stats.completed} remaining
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip: Count Toggle + Custom Item + Hidden Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Count Toggle */}
        <div className="flex items-center gap-1.5 bg-surface-2/60 p-1 rounded-xl border border-border">
          <span className="text-[11px] text-muted-foreground font-medium px-2">Count:</span>
          {(['all', 'subtopics_only', 'practice_only'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCountMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                countMode === mode
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode === 'all'
                ? 'All'
                : mode === 'subtopics_only'
                  ? 'Subtopics'
                  : 'Practice'}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {hiddenIds.size > 0 && (
            <button
              onClick={onOpenHiddenModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2/40 text-muted-foreground hover:text-foreground text-xs"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{hiddenIds.size} hidden</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 text-foreground hover:bg-surface-2/80 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};
