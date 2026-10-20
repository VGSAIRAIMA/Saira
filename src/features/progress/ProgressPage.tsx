import React from 'react';

export const ProgressPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground">Analytics & History</h1>
        <p className="text-sm text-muted-foreground">
          Honest metrics computed strictly from your stored progress. No dummy numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-5 rounded-2xl">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Overall Completion
          </span>
          <div className="text-3xl font-display font-medium text-foreground mt-2">0.0%</div>
          <span className="text-[11px] text-muted-foreground font-mono">0 of 381 items done</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Current Pace
          </span>
          <div className="text-3xl font-display font-medium text-foreground mt-2">0.0</div>
          <span className="text-[11px] text-muted-foreground font-mono">items / active day</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            30-Day Consistency
          </span>
          <div className="text-3xl font-display font-medium text-foreground mt-2">0%</div>
          <span className="text-[11px] text-muted-foreground font-mono">0 of 30 active days</span>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Projected Finish
          </span>
          <div className="text-3xl font-display font-medium text-foreground mt-2">—</div>
          <span className="text-[11px] text-muted-foreground font-mono">Requires logged pace</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">52-Week Study Heatmap</h2>
        <div className="h-32 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-surface-2/20">
          Heatmap will populate with your daily active reps as you study
        </div>
      </div>
    </div>
  );
};
