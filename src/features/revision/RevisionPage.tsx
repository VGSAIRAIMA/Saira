import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { allPhases } from '@/lib/seed';
import { getDayKey, DEFAULT_TIMEZONE, diffDayKeys } from '@/lib/time';
import { REVISION_INTERVALS, getRevisionIntervalDays } from '@/lib/stats/revision';
import { ItemProgress } from '@/types/sheet';

interface FlatRevisionItem {
  id: string;
  title: string;
  phaseId: string;
  phaseName: string;
  topicId: string;
  topicTitle: string;
  links?: {
    video?: string;
    article?: string;
    practice?: string;
  };
  progress: ItemProgress;
  dueDayKey: string;
  step: number;
  isDue: boolean;
  isOverdue: boolean;
  daysDiff: number; // dueDayKey - todayKey
}

export const RevisionPage: React.FC = () => {
  const isLoaded = useSheetStore((s) => s.isLoaded);
  const progress = useSheetStore((s) => s.progress);
  const customItems = useSheetStore((s) => s.customItems);
  const completeRevision = useSheetStore((s) => s.completeRevision);

  const [activeTab, setActiveTab] = useState<'due' | 'upcoming' | 'all'>('due');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [revisionMinutes, setRevisionMinutes] = useState<number>(15);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

  // Flatten all items and match with progress
  const allRevisionItems = useMemo(() => {
    const list: FlatRevisionItem[] = [];

    // 1. Seed items
    for (const phase of allPhases) {
      for (const topic of phase.topics) {
        const topicItems = [...(topic.subtopics || []), ...(topic.practice || [])];
        for (const item of topicItems) {
          const p = progress[item.id];
          if (p && (p.status === 'done' || p.revision)) {
            const dueDayKey = p.revision?.dueDayKey || todayKey;
            const step = p.revision?.step ?? 0;
            const daysDiff = diffDayKeys(dueDayKey, todayKey);
            const isDue = daysDiff <= 0;
            const isOverdue = daysDiff < 0;

            const practiceLink = 'link' in item ? (item.link || undefined) : undefined;
            const links = p.links || (practiceLink ? { practice: practiceLink } : undefined);

            list.push({
              id: item.id,
              title: item.title,
              phaseId: phase.id,
              phaseName: phase.title,
              topicId: topic.id,
              topicTitle: topic.title,
              links,
              progress: p,
              dueDayKey,
              step,
              isDue,
              isOverdue,
              daysDiff,
            });
          }
        }
      }
    }

    // 2. Custom items
    for (const item of customItems) {
      const p = progress[item.id];
      if (p && (p.status === 'done' || p.revision)) {
        const dueDayKey = p.revision?.dueDayKey || todayKey;
        const step = p.revision?.step ?? 0;
        const daysDiff = diffDayKeys(dueDayKey, todayKey);
        const isDue = daysDiff <= 0;
        const isOverdue = daysDiff < 0;

        const phase = allPhases.find((ph) => ph.id === item.phaseId);

        list.push({
          id: item.id,
          title: item.title,
          phaseId: item.phaseId,
          phaseName: phase?.title || 'Custom Phase',
          topicId: item.topicId,
          topicTitle: 'Custom Items',
          links: item.links,
          progress: p,
          dueDayKey,
          step,
          isDue,
          isOverdue,
          daysDiff,
        });
      }
    }

    // Sort by due date ascending (most overdue first)
    return list.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [progress, customItems, todayKey]);

  // Tab counts
  const dueItems = useMemo(() => allRevisionItems.filter((i) => i.isDue), [allRevisionItems]);
  const upcomingItems = useMemo(() => allRevisionItems.filter((i) => !i.isDue), [allRevisionItems]);

  // Filtered list based on active tab, search, and phase
  const displayedItems = useMemo(() => {
    let base =
      activeTab === 'due'
        ? dueItems
        : activeTab === 'upcoming'
        ? upcomingItems
        : allRevisionItems;

    if (selectedPhase !== 'all') {
      base = base.filter((i) => i.phaseId === selectedPhase);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.topicTitle.toLowerCase().includes(q) ||
          i.phaseName.toLowerCase().includes(q)
      );
    }

    return base;
  }, [activeTab, dueItems, upcomingItems, allRevisionItems, selectedPhase, searchQuery]);

  const handleCompleteRevision = async (item: FlatRevisionItem) => {
    await completeRevision(item.id, selectedConfidence, revisionMinutes);
    setReviewingItemId(null);
    setSuccessToast(`Revision logged for "${item.title}"! Step updated.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading revision queue">
        <div className="h-10 w-64 bg-surface-2 rounded-xl" />
        <div className="h-28 bg-surface border border-border/50 rounded-3xl" />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-surface border border-border/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-rise pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500/90 text-white text-xs font-semibold rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 animate-fade-rise"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
              Spaced Revision
            </h1>
            {dueItems.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {dueItems.length} due
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Lock concepts into long-term memory across 5 calibrated intervals (1, 3, 7, 21, and 60 days).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-surface border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('due')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'due'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Now ({dueItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upcoming ({upcomingItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>All ({allRevisionItems.length})</span>
          </button>
        </div>
      </div>

      {/* Interval Guide Strip */}
      <div className="bg-surface border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          The 5-Step Spaced Repetition Ladder
        </span>
        <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
          {REVISION_INTERVALS.map((days, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-surface-2/40 border border-border/60 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Step {idx}</span>
              <span className="text-base sm:text-lg font-bold text-foreground mt-0.5">{days}d</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 hidden sm:inline">
                {idx === 0 ? 'Next day' : idx === 4 ? 'Mastery' : 'Interval'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-1">
          Rating confidence <strong>3 or higher</strong> advances the problem to the next interval. Rating <strong>1 or 2</strong> steps it back one level for reinforce practice.
        </p>
      </div>

      {/* Search & Phase Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search problems, topics or phases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-surface border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Phases</option>
            {allPhases.map((ph) => (
              <option key={ph.id} value={ph.id}>
                {ph.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revision Queue List */}
      {displayedItems.length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {activeTab === 'due'
                ? 'Queue is completely clear!'
                : 'No problems found in this view'}
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {activeTab === 'due'
                ? 'All due revision cards have been completed. Fantastic consistency!'
                : 'Problems appear here automatically as you mark them done on the Sheet.'}
            </p>
          </div>
          {upcomingItems.length > 0 && activeTab === 'due' && (
            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground bg-surface-2 px-3.5 py-2 rounded-xl border border-border">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                Next review due: {upcomingItems[0].dueDayKey} ({upcomingItems[0].title})
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedItems.map((item) => {
            const isReviewing = reviewingItemId === item.id;
            const isNotesExpanded = expandedNotesId === item.id;
            const intervalDays = getRevisionIntervalDays(item.step);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition-all ${
                  item.isOverdue
                    ? 'bg-rose-500/[0.03] border-rose-500/30 shadow-xs'
                    : item.isDue
                    ? 'bg-surface border-amber-500/30 shadow-xs'
                    : 'bg-surface border-border/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Item Metadata */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold">
                        {item.phaseName}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground truncate">{item.topicTitle}</span>
                      <span className="text-muted-foreground">·</span>
                      {item.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue by {Math.abs(item.daysDiff)} {Math.abs(item.daysDiff) === 1 ? 'day' : 'days'}
                        </span>
                      ) : item.isDue ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                          Due today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 font-medium border border-sky-500/20">
                          Due in {item.daysDiff}d ({item.dueDayKey})
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                      {item.title}
                    </h3>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono pt-0.5">
                      <span>Level {item.step} of 4</span>
                      <span>({intervalDays}d interval)</span>
                      {item.progress.confidence && (
                        <span>Rating: {item.progress.confidence}/5 ★</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* External links */}
                    {item.links?.practice && (
                      <a
                        href={item.links.practice}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl border border-border bg-surface-2/60 text-muted-foreground hover:text-foreground transition-colors"
                        title="Open Practice Problem"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Toggle notes preview */}
                    {(item.progress.notes || item.progress.keyIdea || item.progress.mistakes) && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedNotesId(isNotesExpanded ? null : item.id)
                        }
                        className="px-3 py-2 rounded-xl border border-border bg-surface-2/60 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Notes</span>
                        {isNotesExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Review Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingItemId(isReviewing ? null : item.id);
                        setSelectedConfidence(item.progress.confidence || 3);
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isReviewing ? 'Cancel' : 'Log Revision'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Notes Section */}
                {isNotesExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-rise">
                    {item.progress.keyIdea && (
                      <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                          <Lightbulb className="w-3.5 h-3.5" /> Key Idea
                        </span>
                        <p className="text-foreground/90 whitespace-pre-wrap">{item.progress.keyIdea}</p>
                      </div>
                    )}
                    {item.progress.mistakes && (
                      <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1">
                        <span className="font-semibold text-rose-400 flex items-center gap-1 font-mono text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Mistakes & Pitfalls
                        </span>
                        <p className="text-foreground/90 whitespace-pre-wrap">{item.progress.mistakes}</p>
                      </div>
                    )}
                    {item.progress.notes && (
                      <div className="p-3 rounded-2xl bg-surface-2/60 border border-border/80 col-span-full space-y-1">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5" /> Detailed Notes
                        </span>
                        <p className="text-foreground/90 whitespace-pre-wrap font-mono text-[11px]">
                          {item.progress.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Log Revision Pop-Down */}
                {isReviewing && (
                  <div className="mt-4 pt-4 border-t border-border/60 space-y-4 bg-surface-2/40 p-4 rounded-2xl animate-fade-rise">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground block">
                        How well did you recall and solve this problem?
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Rating 1–2 steps back one interval for revision. Rating 3–5 advances to the next step.
                      </p>
                    </div>

                    {/* Confidence Rating Buttons */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { val: 1 as const, label: '1 · Hard', desc: 'Step back' },
                        { val: 2 as const, label: '2 · Shaky', desc: 'Step back' },
                        { val: 3 as const, label: '3 · Good', desc: 'Advance' },
                        { val: 4 as const, label: '4 · Strong', desc: 'Advance' },
                        { val: 5 as const, label: '5 · Master', desc: 'Advance' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setSelectedConfidence(opt.val)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedConfidence === opt.val
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                              : 'bg-surface border-border/60 text-muted-foreground hover:text-foreground hover:bg-surface-2'
                          }`}
                        >
                          <span className="text-xs block font-mono">{opt.label}</span>
                          <span className="text-[9px] opacity-80 block">{opt.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Time Spent and Submit */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">Time spent:</span>
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={revisionMinutes}
                          onChange={(e) => setRevisionMinutes(parseInt(e.target.value, 10) || 15)}
                          className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-xs font-mono text-center text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">mins</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewingItemId(null)}
                          className="px-3.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteRevision(item)}
                          className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Save & Advance</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
