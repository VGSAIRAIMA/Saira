import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, History } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { StatCards } from './components/StatCards';
import { PhaseBars } from './components/PhaseBars';
import { WeeklyVelocityChart } from './components/WeeklyVelocityChart';
import { ConfidenceDistribution } from './components/ConfidenceDistribution';
import { Heatmap52 } from '@/features/history/Heatmap52';
import { ActivityLogTable } from '@/features/history/ActivityLogTable';
import { WeeklyReviewsHistory } from '@/features/history/WeeklyReviewsHistory';

export const ProgressPage: React.FC = () => {
  const isLoaded = useSheetStore((s) => s.isLoaded);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'history' ? 'history' : 'analytics';

  const handleTabChange = (tab: 'analytics' | 'history') => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-8 animate-fade-rise pb-12">
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
            Progress & History
          </h1>
          <p className="text-sm text-muted-foreground">
            Honest metrics computed strictly from your stored progress. No dummy numbers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-surface border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {!isLoaded ? (
        currentTab === 'analytics' ? (
          <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading analytics">
            {/* 4 Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-border/50 p-6 rounded-3xl h-36 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-28 bg-surface-2 rounded-lg" />
                    <div className="w-8 h-8 rounded-xl bg-surface-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-24 bg-surface-2 rounded-lg" />
                    <div className="h-3 w-32 bg-surface-2/60 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            {/* Phase Bars Skeleton */}
            <div className="bg-surface border border-border/50 rounded-3xl p-7 space-y-4">
              <div className="h-5 w-44 bg-surface-2 rounded-lg" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-surface-2/30 border border-border/30 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* Bottom Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-72 bg-surface border border-border/50 rounded-3xl p-6" />
              <div className="h-72 bg-surface border border-border/50 rounded-3xl p-6" />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading history">
            <div className="h-72 bg-surface border border-border/50 rounded-3xl p-6" />
            <div className="h-80 bg-surface border border-border/50 rounded-3xl p-6" />
          </div>
        )
      ) : currentTab === 'analytics' ? (
        <div className="space-y-8">
          {/* Top 4 Stat Cards */}
          <StatCards />

          {/* Phase Completion Breakdown */}
          <PhaseBars />

          {/* Grid: Weekly Study Velocity (2 cols on lg) & Confidence Distribution (1 col on lg) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WeeklyVelocityChart />
            <ConfidenceDistribution />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Weekly Reviews Section */}
          <WeeklyReviewsHistory />

          {/* 52-Week Study Heatmap */}
          <Heatmap52 />

          {/* Chronological Activity Log Table */}
          <ActivityLogTable />
        </div>
      )}
    </div>
  );
};
