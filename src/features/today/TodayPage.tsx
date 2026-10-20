import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, CheckCircle2 } from 'lucide-react';

export const TodayPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-rise">
      {/* Greeting Header */}
      <div className="space-y-1">
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
          Hello, Raima
        </h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s build consistency today. Step by step, item by item.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quote Card */}
        <div className="md:col-span-2 bg-surface border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">
              Daily Inspiration
            </span>
            <blockquote className="font-display text-2xl sm:text-3xl text-foreground/90 leading-snug">
              &ldquo;The expert in anything was once a beginner.&rdquo;
            </blockquote>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
            <span>Helen Hayes</span>
            <span className="italic">Mindset & Consistency</span>
          </div>
        </div>

        {/* Today's Target Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Today&apos;s Target
              </span>
              <span className="text-xs font-mono text-muted-foreground">0 / 3 items</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full border-2 border-border flex items-center justify-center font-semibold text-lg font-mono">
                0%
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>3 daily reps planned</p>
                <p className="text-foreground/80 font-medium">Ready to start</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-warning font-medium">
              <Flame className="w-4 h-4 fill-warning" /> 0 day streak
            </span>
            <span className="text-muted-foreground font-mono">0 min spent</span>
          </div>
        </div>
      </div>

      {/* Continue Learning Banner */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-ph-0/10 text-ph-0 border border-ph-0/30 font-medium">
              Phase 0: Foundations
            </span>
            <span className="text-xs text-muted-foreground">Up Next</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Version control: why and how it works
          </h2>
          <p className="text-xs text-muted-foreground">Git and GitHub · 8 subtopics</p>
        </div>

        <Link
          to="/sheet"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <span>Continue Sheet</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Habits / Last 7 Days Strip */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Last 7 Days Consistency</h3>
          <span className="text-xs text-muted-foreground">1 active day minimum for streak</span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-2">
              <span className="text-muted-foreground text-[11px]">{day}</span>
              <div
                className={`w-10 h-10 rounded-xl border border-border/70 flex items-center justify-center ${
                  i === 6 ? 'border-primary/50 bg-primary/5 text-primary' : 'bg-surface-2/40'
                }`}
              >
                {i === 6 ? <CheckCircle2 className="w-4 h-4 opacity-40" /> : <span className="text-muted-foreground/40 font-mono">0</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
