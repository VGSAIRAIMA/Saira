import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Filter, Layers } from 'lucide-react';
import seedData from '@/data/sheet.seed.json';

export const SheetPage: React.FC = () => {
  const { phaseId } = useParams();
  const currentPhase = seedData.phases.find((p) => p.id === phaseId) || seedData.phases[0];

  return (
    <div className="space-y-6">
      {/* Header with Search and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              Roadmap · Java
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              6 Phases · 43 Topics · 381 Items
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl mt-1 text-foreground">DSA Curriculum</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics, problems... (Ctrl+K)"
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs text-muted-foreground hover:text-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Sheet Grid: Left Rail + Main Topic List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Phase Rail */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
            Phases
          </div>
          <div className="space-y-1.5">
            {seedData.phases.map((phase, idx) => {
              const isActive = phase.id === currentPhase.id;
              const accentColor = `var(--ph${idx})`;
              return (
                <Link
                  key={phase.id}
                  to={`/sheet/${phase.id}`}
                  className={`block p-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'bg-surface border-border shadow-sm'
                      : 'border-transparent hover:bg-surface/60 hover:border-border/40'
                  }`}
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: accentColor,
                  }}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground line-clamp-1">{phase.title}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">0%</span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: '0%', backgroundColor: accentColor }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content Area: Topics & Checklist */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
              <div>
                <span className="text-xs font-mono font-medium text-primary">
                  Phase {currentPhase.order}
                </span>
                <h2 className="text-xl font-semibold text-foreground">{currentPhase.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  {currentPhase.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-display text-foreground font-medium">0%</span>
                <span className="block text-[11px] text-muted-foreground font-mono">0 of {currentPhase.topics.length} topics</span>
              </div>
            </div>

            {/* Topic Accordions */}
            <div className="mt-6 space-y-3">
              {currentPhase.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="border border-border/80 rounded-xl bg-surface-2/30 p-4 transition-colors hover:border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground">{topic.title}</h3>
                          {topic.sources.map((src) => (
                            <span
                              key={src}
                              className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-surface-2 text-muted-foreground"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {topic.subtopics?.length || 0} subtopics · {topic.practice?.length || 0} practice problems
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-muted-foreground">0%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
