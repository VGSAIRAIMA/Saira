import React, { useState } from 'react';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDayKey, parseDayKey, addDaysToDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import { DayLog } from '@/types/sheet';
import { isActiveDay, isPureRestDay } from '@/lib/stats/activeDay';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CellData {
  dayKey: string;
  dateObj: Date;
  isFuture: boolean;
  isToday: boolean;
  log?: DayLog;
  intensity: number;
}

export const Heatmap52: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const todayDate = parseDayKey(todayKey);

  const [hoveredCell, setHoveredCell] = useState<{
    cell: CellData;
    rect: { top: number; left: number };
  } | null>(null);

  // Determine the Saturday ending the current week
  const todayDayOfWeek = todayDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSaturday = 6 - todayDayOfWeek;
  const gridEndKey = addDaysToDayKey(todayKey, daysUntilSaturday);

  // 52 weeks = 364 days. Start date is gridEndKey - 363 days
  const gridStartKey = addDaysToDayKey(gridEndKey, -363);

  // Build 52 columns (weeks), each containing 7 rows (days Sun-Sat)
  const weeks: CellData[][] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let currentMonth = -1;

  for (let w = 0; w < 52; w++) {
    const weekCells: CellData[] = [];
    for (let d = 0; d < 7; d++) {
      const daysFromStart = w * 7 + d;
      const dayKey = addDaysToDayKey(gridStartKey, daysFromStart);
      const dateObj = parseDayKey(dayKey);
      const isFuture = dayKey > todayKey;
      const isToday = dayKey === todayKey;
      const log = dayLogs[dayKey];

      // Calculate intensity
      let intensity = 0;
      if (!isFuture && log) {
        const completedTotal = (log.completed || 0) + (log.revised || 0);
        const minutes = log.minutes || 0;
        if (completedTotal >= 5 || minutes >= 90) intensity = 4;
        else if (completedTotal >= 3 || minutes >= 60) intensity = 3;
        else if (completedTotal >= 2 || minutes >= 30) intensity = 2;
        else if (completedTotal >= 1 || minutes >= 15 || isPureRestDay(log)) intensity = 1;
      }

      weekCells.push({
        dayKey,
        dateObj,
        isFuture,
        isToday,
        log,
        intensity,
      });

      // Track month changes on Sunday (row 0)
      if (d === 0) {
        const m = dateObj.getUTCMonth();
        if (m !== currentMonth) {
          currentMonth = m;
          monthLabels.push({ weekIndex: w, label: MONTH_NAMES[m] });
        }
      }
    }
    weeks.push(weekCells);
  }

  // Count active days in the 52-week period
  let activeDays52 = 0;
  let itemsCompleted52 = 0;
  for (const week of weeks) {
    for (const cell of week) {
      if (!cell.isFuture && cell.log) {
        if (isActiveDay(cell.log) || isPureRestDay(cell.log)) {
          activeDays52++;
        }
        itemsCompleted52 += cell.log.completed || 0;
      }
    }
  }

  const intensityClasses = [
    'bg-surface-2/40 border-border/30 hover:border-muted-foreground/40', // 0
    'bg-primary/25 border-primary/30 hover:border-primary/60',          // 1
    'bg-primary/50 border-primary/50 hover:border-primary/80',          // 2
    'bg-primary/75 border-primary/70 hover:border-primary',             // 3
    'bg-primary border-primary hover:brightness-110 shadow-xs',        // 4
  ];

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">52-Week Study Heatmap</h2>
          <p className="text-xs text-muted-foreground">
            364 days of daily reps. Hover any square to inspect activity details.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1 rounded-full bg-surface-2 border border-border">
            <span className="font-semibold text-primary">{activeDays52}</span> active days
          </div>
          <div className="px-3 py-1 rounded-full bg-surface-2 border border-border">
            <span className="font-semibold text-foreground">{itemsCompleted52}</span> items completed
          </div>
        </div>
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto pb-3 pt-1 -mx-2 px-2 scrollbar-thin">
        <div className="inline-block min-w-[760px]">
          {/* Month labels row */}
          <div className="flex text-[11px] font-mono text-muted-foreground mb-2 pl-8 relative h-4">
            {monthLabels.map(({ weekIndex, label }, i) => (
              <span
                key={`${label}-${weekIndex}-${i}`}
                className="absolute"
                style={{ left: `calc(2rem + ${weekIndex * 14}px)` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Heatmap matrix: 7 rows with day labels on left */}
          <div className="flex">
            {/* Day of week labels on left (Mon, Wed, Fri) */}
            <div className="w-8 flex flex-col justify-between py-0.5 text-[10px] font-mono text-muted-foreground select-none pr-1">
              <span className="h-[12px] leading-[12px] invisible">Sun</span>
              <span className="h-[12px] leading-[12px]">Mon</span>
              <span className="h-[12px] leading-[12px] invisible">Tue</span>
              <span className="h-[12px] leading-[12px]">Wed</span>
              <span className="h-[12px] leading-[12px] invisible">Thu</span>
              <span className="h-[12px] leading-[12px]">Fri</span>
              <span className="h-[12px] leading-[12px] invisible">Sat</span>
            </div>

            {/* The 52 columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((cell) => {
                    const isFut = cell.isFuture;
                    return (
                      <button
                        key={cell.dayKey}
                        type="button"
                        disabled={isFut}
                        onMouseEnter={(e) => {
                          if (isFut) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            cell,
                            rect: {
                              top: rect.top - 8,
                              left: rect.left + rect.width / 2,
                            },
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-[11px] h-[11px] rounded-[2.5px] border transition-colors ${
                          isFut
                            ? 'bg-transparent border-transparent cursor-default'
                            : `${intensityClasses[cell.intensity]} cursor-pointer ${
                                cell.isToday ? 'ring-1 ring-white/60' : ''
                              }`
                        }`}
                        aria-label={`${cell.dayKey}: ${cell.log?.completed || 0} items`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap legend and note */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
        <span className="text-[11px]">Consistent reps compound into mastery</span>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2.5px] bg-surface-2/40 border border-border/30" />
          <div className="w-3 h-3 rounded-[2.5px] bg-primary/25 border border-primary/30" />
          <div className="w-3 h-3 rounded-[2.5px] bg-primary/50 border border-primary/50" />
          <div className="w-3 h-3 rounded-[2.5px] bg-primary/75 border border-primary/70" />
          <div className="w-3 h-3 rounded-[2.5px] bg-primary border border-primary" />
          <span>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-surface-2 border border-border text-foreground text-xs shadow-xl animate-fade-rise"
          style={{
            top: `${hoveredCell.rect.top}px`,
            left: `${hoveredCell.rect.left}px`,
          }}
        >
          <div className="font-semibold text-foreground">
            {hoveredCell.cell.dateObj.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {hoveredCell.cell.isToday && <span className="ml-1 text-primary">(Today)</span>}
          </div>

          <div className="text-[11px] text-muted-foreground mt-0.5 space-y-0.5">
            <div>
              <span className="font-medium text-foreground">
                {hoveredCell.cell.log?.completed || 0}
              </span>{' '}
              items completed
            </div>
            {hoveredCell.cell.log?.revised ? (
              <div>
                <span className="font-medium text-foreground">{hoveredCell.cell.log.revised}</span>{' '}
                items revised
              </div>
            ) : null}
            {hoveredCell.cell.log?.minutes ? (
              <div>
                <span className="font-medium text-foreground">{hoveredCell.cell.log.minutes}</span>{' '}
                min logged
              </div>
            ) : null}
            {hoveredCell.cell.log?.restDay ? (
              <div className="text-amber-400 font-medium">Rest day taken</div>
            ) : null}
            {!hoveredCell.cell.log && <div className="italic">No study activity</div>}
          </div>
        </div>
      )}
    </div>
  );
};
