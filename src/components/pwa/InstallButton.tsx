import React from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface InstallButtonProps {
  variant?: 'topbar' | 'settings' | 'card';
  className?: string;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'topbar',
  className = '',
}) => {
  const { canInstall, isInstalled, showIOSPrompt, promptInstall, dismissIOSPrompt } =
    usePWAInstall();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <>
      {variant === 'topbar' && (
        <button
          type="button"
          onClick={promptInstall}
          title="Install SAIRA as an app"
          aria-label="Install SAIRA as an app"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-medium transition-colors cursor-pointer shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'settings' && (
        <div className={`p-5 rounded-2xl bg-surface-2/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Install SAIRA Desktop & Mobile App
            </h4>
            <p className="text-xs text-muted-foreground">
              Enjoy a fast, distraction-free standalone window that works completely offline.
            </p>
          </div>
          <button
            type="button"
            onClick={promptInstall}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
          >
            Install Now
          </button>
        </div>
      )}

      {variant === 'card' && (
        <button
          type="button"
          onClick={promptInstall}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install SAIRA</span>
        </button>
      )}

      {/* iOS Instructions Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-rise">
          <div className="w-full max-w-sm rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Install on iOS</h3>
              <button
                type="button"
                onClick={dismissIOSPrompt}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Install SAIRA to your iPhone or iPad home screen for an app-like offline experience:
            </p>

            <ol className="space-y-3 text-xs text-foreground/90 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[11px] font-mono shrink-0">
                  1
                </span>
                <span>
                  Tap the <Share2 className="inline w-3.5 h-3.5 mx-1 text-primary" /> <strong>Share</strong> button in Safari toolbar
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[11px] font-mono shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-primary" /> <strong>Add to Home Screen</strong>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[11px] font-mono shrink-0">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top-right corner</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={dismissIOSPrompt}
              className="w-full py-2.5 rounded-xl bg-surface-2 border border-border text-xs font-semibold text-foreground hover:bg-surface-2/80 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
