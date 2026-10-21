import React, { useState } from 'react';
import { Calendar, CheckCircle2, Moon } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { parseDayKey } from '@/lib/time';
import { isActiveDay, isPureRestDay } from '@/lib/stats/activeDay';

export const ActivityLogTable: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const [displayCount, setDisplayCount] = useState(15);

  // Filter and sort dayLogs in reverse chronological order
  const sortedLogs = Object.values(dayLogs)
    .filter((log) => (log.completed || 0) > 0 || (log.revised || 0) > 0 || (log.minutes || 0) > 0 || log.restDay)
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey));

  if (sortedLogs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-muted-foreground mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Study Logs Yet</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Your daily activity log will record every completed problem, revision, and study session automatically as you work through the sheet.
        </p>
      </div>
    );
  }

  const visibleLogs = sortedLogs.slice(0, displayCount);

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Activity History Log</h3>
          <p className="text-xs text-muted-foreground">
            A permanent chronological record of your study reps.
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {sortedLogs.length} {sortedLogs.length === 1 ? 'day' : 'days'} recorded
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-mono uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Completed</th>
              <th className="py-3 px-3 text-right">Revised</th>
              <th className="py-3 px-3 text-right">Minutes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {visibleLogs.map((log) => {
              const dateObj = parseDayKey(log.dayKey);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              const active = isActiveDay(log);
              const rest = isPureRestDay(log);

              return (
                <tr key={log.dayKey} className="hover:bg-surface-2/30 transition-colors">
                  <td className="py-3.5 px-3 font-sans font-medium text-foreground whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="py-3.5 px-3">
                    {active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Active Day
                      </span>
                    ) : rest ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Moon className="w-3 h-3" />
                        Rest Day
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-surface-2 text-muted-foreground border border-border">
                        Logged
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-foreground">
                    {log.completed || 0}
                  </td>
                  <td className="py-3.5 px-3 text-right text-muted-foreground">
                    {log.revised || 0}
                  </td>
                  <td className="py-3.5 px-3 text-right text-muted-foreground">
                    {log.minutes ? `${log.minutes}m` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedLogs.length > displayCount && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 20)}
            className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-xs font-medium text-foreground transition-colors cursor-pointer border border-border"
          >
            Show more days ({sortedLogs.length - displayCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
