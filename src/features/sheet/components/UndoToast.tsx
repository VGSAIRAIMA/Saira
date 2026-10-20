import React from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import { RotateCcw, X } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const { undoToast, undoLastTick, dismissUndoToast } = useSheetStore();

  if (!undoToast) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-surface-2 border border-border/80 text-foreground shadow-2xl animate-fade-rise text-xs font-medium backdrop-blur-md">
      <span className="truncate max-w-[220px] sm:max-w-[320px]">
        {undoToast.previousStatus === 'done'
          ? `Marked "${undoToast.title}" as not started`
          : `Marked "${undoToast.title}" as completed`}
      </span>

      <button
        type="button"
        onClick={undoLastTick}
        className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={dismissUndoToast}
        className="p-1 text-muted-foreground hover:text-foreground rounded-full"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
