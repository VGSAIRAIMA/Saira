import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Offline Mode Notice"
      className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs transition-all animate-fade-rise"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="leading-snug">
            <strong className="font-semibold text-amber-300">You are offline.</strong>{' '}
            SAIRA works seamlessly offline. Your progress, ticks, and notes are saved locally in IndexedDB and will sync once reconnected.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          title="Dismiss offline notice"
          aria-label="Dismiss offline notice"
          className="p-1 rounded-md text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
