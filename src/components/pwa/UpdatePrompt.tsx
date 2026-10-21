import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Periodic check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm rounded-3xl bg-surface border border-primary/40 p-5 shadow-2xl animate-fade-rise flex flex-col gap-3 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Update Available</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              A new version of SAIRA is ready. Reload when you&apos;re ready to get the latest features.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Dismiss update alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 self-end">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Update Now</span>
        </button>
      </div>
    </div>
  );
};
