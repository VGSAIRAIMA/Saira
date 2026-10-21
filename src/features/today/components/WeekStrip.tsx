import React from 'react';
import { CheckCircle2, Moon, Circle } from 'lucide-react';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDayKey, addDaysToDayKey, parseDayKey, DEFAULT_TIMEZONE } from '@/lib/time';
import { isActiveDay, isPureRestDay } from '@/lib/stats/activeDay';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WeekStrip: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);

  const days: { dayKey: string; dateObj: Date; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDaysToDayKey(todayKey, -i);
    days.push({
      dayKey: k,
      dateObj: parseDayKey(k),
      isToday: i === 0,
    });
  }

  let activeCount7 = 0;
  days.forEach(({ dayKey }) => {
    const log = dayLogs[dayKey];
    if (log && (isActiveDay(log) || isPureRestDay(log))) {
      activeCount7++;
    }
  });

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">7-Day Consistency</h3>
          <p className="text-xs text-muted-foreground">
            Complete at least 1 item or log 15+ minutes each day to maintain momentum.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded-full bg-surface-2 border border-border text-foreground self-start sm:self-auto">
          <span className="font-semibold text-primary">{activeCount7}</span> / 7 active days
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {days.map(({ dayKey, dateObj, isToday }) => {
          const log = dayLogs[dayKey];
          const active = log ? isActiveDay(log) : false;
          const rest = log ? isPureRestDay(log) : false;
          const dayName = DAY_NAMES[dateObj.getUTCDay()];
          const dayNumber = dateObj.getUTCDate();
          const completed = log?.completed || 0;

          return (
            <div
              key={dayKey}
              className={`flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all ${
                isToday
                  ? 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border/60 bg-surface-2/30 hover:bg-surface-2/60'
              }`}
            >
              <span className={`text-[11px] font-medium uppercase tracking-wider ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {dayName}
              </span>

              <span className="font-mono text-sm sm:text-base font-semibold text-foreground my-1.5">
                {dayNumber}
              </span>

              <div className="mt-1">
                {active ? (
                  <div className="flex items-center justify-center text-primary" title={`${completed} items completed`}>
                    <CheckCircle2 className="w-5 h-5 fill-primary/20 stroke-primary" />
                  </div>
                ) : rest ? (
                  <div className="flex items-center justify-center text-amber-400" title="Rest day taken">
                    <Moon className="w-5 h-5 fill-amber-400/20 stroke-amber-400" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground/30" title="No activity recorded">
                    <Circle className="w-5 h-5" />
                  </div>
                )}
              </div>

              {completed > 0 ? (
                <span className="text-[10px] font-mono text-muted-foreground mt-2">
                  {completed} {completed === 1 ? 'item' : 'items'}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-transparent mt-2 select-none">
                  -
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
