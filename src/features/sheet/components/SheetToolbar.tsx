import React from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  Search,
  Star,
  Clock,
  AlertTriangle,
  FileText,
  RotateCcw,
  Database,
} from 'lucide-react';
import { Status, SourceTag } from '@/types/sheet';

interface SheetToolbarProps {
  onOpenSearch: () => void;
  onOpenExportImport: () => void;
}

export const SheetToolbar: React.FC<SheetToolbarProps> = ({
  onOpenSearch,
  onOpenExportImport,
}) => {
  const { filters, setFilter, resetFilters } = useSheetStore();

  const isAnyFilterActive =
    filters.status !== 'all' ||
    filters.source !== 'all' ||
    filters.bookmarkedOnly ||
    filters.dueRevisionOnly ||
    filters.lowConfidenceOnly ||
    filters.hasNotesOnly;

  return (
    <div className="space-y-2.5">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input Bar (triggers SearchModal or inline search) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 max-w-md flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Search curriculum, notes, key ideas...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-2 border border-border text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>

        {/* Backup / Export / Import Trigger */}
        <div className="flex items-center gap-2">
          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2/60 text-muted-foreground hover:text-foreground text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={onOpenExportImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground text-xs"
            title="Backup and Restore Data"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Data Backup</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as 'all' | Status)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">Status: All</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
          <option value="needs_revision">Needs Revision</option>
        </select>

        {/* Source Dropdown */}
        <select
          value={filters.source}
          onChange={(e) => setFilter('source', e.target.value as 'all' | SourceTag)}
          className="bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">Source: All</option>
          <option value="K">K (Kunal)</option>
          <option value="S">S (Striver)</option>
          <option value="+">+ (Added)</option>
        </select>

        {/* Bookmark Toggle */}
        <button
          type="button"
          onClick={() => setFilter('bookmarkedOnly', !filters.bookmarkedOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors flex-none ${
            filters.bookmarkedOnly
              ? 'bg-warning/20 border-warning text-warning font-semibold'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filters.bookmarkedOnly ? 'fill-warning' : ''}`} />
          <span>Bookmarked</span>
        </button>

        {/* Due Revision Toggle */}
        <button
          type="button"
          onClick={() => setFilter('dueRevisionOnly', !filters.dueRevisionOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors flex-none ${
            filters.dueRevisionOnly
              ? 'bg-primary/20 border-primary text-foreground font-semibold'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Due Revision</span>
        </button>

        {/* Low Confidence Toggle */}
        <button
          type="button"
          onClick={() => setFilter('lowConfidenceOnly', !filters.lowConfidenceOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors flex-none ${
            filters.lowConfidenceOnly
              ? 'bg-danger/20 border-danger text-danger font-semibold'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Confidence ≤ 2</span>
        </button>

        {/* Has Notes Toggle */}
        <button
          type="button"
          onClick={() => setFilter('hasNotesOnly', !filters.hasNotesOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors flex-none ${
            filters.hasNotesOnly
              ? 'bg-primary/20 border-primary text-foreground font-semibold'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Has Notes</span>
        </button>
      </div>
    </div>
  );
};
