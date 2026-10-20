import React from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import { getItemMeta } from '@/lib/seed';
import { X, Eye, EyeOff } from 'lucide-react';

interface HiddenItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HiddenItemsModal: React.FC<HiddenItemsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { hiddenIds, toggleHideItem, customItems, progress } = useSheetStore();

  if (!isOpen) return null;

  const hiddenList = Array.from(hiddenIds).map((id) => {
    const meta = getItemMeta(id);
    const custom = customItems.find((c) => c.id === id);
    const prog = progress[id];
    const title = prog?.titleOverride || meta?.title || custom?.title || id;
    const parent = meta?.topic.title || 'Custom';
    return { id, title, parent };
  });

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
      />
      <div className="fixed inset-x-4 top-24 max-w-lg mx-auto bg-surface border border-border rounded-2xl z-50 shadow-2xl p-6 space-y-4 animate-fade-rise">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Hidden Items ({hiddenList.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Hidden items are excluded from overall and topic percentage calculations. You can unhide
          them at any time.
        </p>

        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {hiddenList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No items are currently hidden.
            </div>
          ) : (
            hiddenList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface-2/40 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground block truncate">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono block truncate">
                    {item.parent}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHideItem(item.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-foreground hover:bg-surface-2/80 transition-colors text-xs font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Unhide</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface-2/80 text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};
