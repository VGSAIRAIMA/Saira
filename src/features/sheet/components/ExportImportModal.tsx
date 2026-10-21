import React, { useRef, useState } from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { getDayKey } from '@/lib/time';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { exportData, exportDataCsv, importData } = useSheetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleExportJson = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saira-backup-${getDayKey(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'JSON backup downloaded successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Export failed: ${msg}` });
    }
  };

  const handleExportCsv = () => {
    try {
      const csv = exportDataCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saira-progress-${getDayKey(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'CSV export downloaded successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `CSV export failed: ${msg}` });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      setFeedback({
        type: 'success',
        message: 'Backup restored successfully! All your progress has been refreshed.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: 'error',
        message: `Failed to restore backup: ${msg}`,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
      />
      <div className="fixed inset-x-4 top-24 max-w-lg mx-auto bg-surface border border-border rounded-2xl z-50 shadow-2xl p-6 space-y-5 animate-fade-rise text-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-foreground">
            Data Backup: Export &amp; Import
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Your progress, notes, bookmarks, and day logs are stored locally on your machine.
          Export a JSON backup to keep your study record safe or transfer it to another computer.
          Export CSV opens the data in any spreadsheet app.
        </p>

        {feedback && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-success/15 border-success/30 text-success'
                : 'bg-danger/15 border-danger/30 text-danger'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-none" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-none" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export JSON Button */}
          <button
            id="export-json-btn"
            type="button"
            onClick={handleExportJson}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-surface-2/40 hover:bg-surface-2 hover:border-primary/50 transition-all text-center gap-2 group"
          >
            <Download className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold text-foreground block text-[11px]">
                Export JSON
              </span>
              <span className="text-[10px] text-muted-foreground">Full backup</span>
            </div>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCsv}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-surface-2/40 hover:bg-surface-2 hover:border-primary/50 transition-all text-center gap-2 group"
          >
            <FileText className="w-5 h-5 text-accent-pink group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold text-foreground block text-[11px]">
                Export CSV
              </span>
              <span className="text-[10px] text-muted-foreground">For spreadsheets</span>
            </div>
          </button>

          {/* Import Button */}
          <button
            id="import-json-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-surface-2/40 hover:bg-surface-2 hover:border-primary/50 transition-all text-center gap-2 group"
          >
            <Upload className="w-5 h-5 text-warning group-hover:scale-110 transition-transform" />
            <div>
              <span className="font-semibold text-foreground block text-[11px]">
                Import JSON
              </span>
              <span className="text-[10px] text-muted-foreground">Restore backup</span>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface-2/80 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
