import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

export const RevisionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground">Spaced Revision</h1>
        <p className="text-sm text-muted-foreground">
          Review completed items at calibrated intervals (1, 3, 7, 21, 60 days) to lock them into long-term memory.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-medium text-foreground mb-1">Queue is clear!</h2>
        <p className="text-xs text-muted-foreground mb-6 max-w-xs">
          As you mark problems done on the sheet, they will automatically appear here when due for revision.
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
          <Clock className="w-3.5 h-3.5" />
          <span>Next review: None scheduled</span>
        </div>
      </div>
    </div>
  );
};
