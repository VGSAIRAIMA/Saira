import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle, Code2 } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { getItemMeta } from '@/lib/seed';

export const ContinueCard: React.FC = () => {
  const getContinueItemId = useSheetStore((s) => s.getContinueItemId);
  const nextItemId = getContinueItemId();

  if (!nextItemId) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Curriculum Mastered
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            All curriculum items completed!
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            You have checked off every topic and practice problem in SAIRA. Review your notes or explore the Revision queue.
          </p>
        </div>

        <Link
          to="/revision"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0 shadow-sm"
        >
          <span>Spaced Revision</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const meta = getItemMeta(nextItemId);
  if (!meta) {
    return null;
  }

  const { phase, topic, title, kind } = meta;

  // Phase color token helper
  const phaseColors: Record<number, { bg: string; text: string; border: string }> = {
    0: { bg: 'bg-ph-0/10', text: 'text-ph-0', border: 'border-ph-0/30' },
    1: { bg: 'bg-ph-1/10', text: 'text-ph-1', border: 'border-ph-1/30' },
    2: { bg: 'bg-ph-2/10', text: 'text-ph-2', border: 'border-ph-2/30' },
    3: { bg: 'bg-ph-3/10', text: 'text-ph-3', border: 'border-ph-3/30' },
    4: { bg: 'bg-ph-4/10', text: 'text-ph-4', border: 'border-ph-4/30' },
    5: { bg: 'bg-ph-5/10', text: 'text-ph-5', border: 'border-ph-5/30' },
  };

  const pColor = phaseColors[phase.order] || phaseColors[0];

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${pColor.bg} ${pColor.text} border ${pColor.border}`}
          >
            Phase {phase.order}: {phase.title}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {kind === 'subtopic' ? (
              <>
                <BookOpen className="w-3.5 h-3.5" /> Concept Subtopic
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5" /> Practice Problem
              </>
            )}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground">
          {topic.title} · Next step in your learning path
        </p>
      </div>

      <Link
        to={`/sheet/${phase.id}/${topic.id}`}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shrink-0 shadow-sm"
      >
        <span>Continue Sheet</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
