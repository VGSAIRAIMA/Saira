import React, { useState } from 'react';
import { Flame, Clock, Edit2, CheckCircle2 } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { calculateStreak } from '@/lib/stats/streak';
import { getDayKey, DEFAULT_TIMEZONE } from '@/lib/time';

export const TodayTargetRing: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const dailyTarget = useSheetStore((s) => s.dailyTarget);
  const setDailyTarget = useSheetStore((s) => s.setDailyTarget);

  const [isEditing, setIsEditing] = useState(false);
  const [targetDraft, setTargetDraft] = useState(dailyTarget);

  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const todayLog = dayLogs[todayKey];
  const completedToday = todayLog?.completed || 0;
  const minutesToday = todayLog?.minutes || 0;
  const streak = calculateStreak(dayLogs);

  const percentage = Math.min(100, Math.round((completedToday / dailyTarget) * 100));
  const isGoalMet = completedToday >= dailyTarget;

  // SVG ring parameters
  const size = 120;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    await setDailyTarget(targetDraft);
    setIsEditing(false);
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
      {/* Target header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Today&apos;s Target
        </span>
        <button
          type="button"
          onClick={() => {
            setTargetDraft(dailyTarget);
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <span>{completedToday} / {dailyTarget} items</span>
          <Edit2 className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Target Editor dialog overlay if active */}
      {isEditing && (
        <form onSubmit={handleSaveTarget} className="mb-4 p-3 rounded-xl bg-surface-2 border border-border text-xs space-y-2">
          <label className="block text-muted-foreground font-medium">Set daily target (items):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              value={targetDraft}
              onChange={(e) => setTargetDraft(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 bg-surface border border-border rounded font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-primary text-white rounded font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Progress Ring and message */}
      <div className="flex items-center gap-6 my-2">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--surface-2)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isGoalMet ? '#10B981' : '#8B3DFF'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isGoalMet ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <span className="font-display text-2xl font-bold text-foreground">
                {percentage}%
              </span>
            )}
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              {isGoalMet ? 'Done' : 'Target'}
            </span>
          </div>
        </div>

        <div className="text-xs space-y-1.5 flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">
            {isGoalMet ? 'Goal crushed today!' : `${Math.max(0, dailyTarget - completedToday)} items remaining`}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {isGoalMet
              ? 'Excellent discipline! Feel free to solve bonus problems or take a restful evening.'
              : `${completedToday} of ${dailyTarget} completed so far. One solid problem at a time.`}
          </p>
        </div>
      </div>

      {/* Bottom stats: Streak + Minutes spent */}
      <div className="pt-4 mt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-warning font-medium">
          <Flame className="w-4 h-4 fill-warning" />
          <span>{streak.currentStreak} day streak</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{minutesToday} min spent</span>
        </div>
      </div>
    </div>
  );
};
