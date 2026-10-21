import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useSheetStore } from '@/stores/useSheetStore';
import { getDayKey, parseDayKey, addDaysToDayKey, DEFAULT_TIMEZONE } from '@/lib/time';

interface WeekData {
  label: string;
  fullDate: string;
  completed: number;
  revised: number;
}

export const WeeklyVelocityChart: React.FC = () => {
  const dayLogs = useSheetStore((s) => s.dayLogs);
  const todayKey = getDayKey(new Date(), DEFAULT_TIMEZONE);
  const todayDate = parseDayKey(todayKey);

  // Find Sunday start of the current week
  const todayDayOfWeek = todayDate.getUTCDay(); // 0 is Sunday
  const currentWeekSundayKey = addDaysToDayKey(todayKey, -todayDayOfWeek);

  // Build the last 8 weeks (from 7 weeks ago up to current week)
  const weeksData: WeekData[] = [];
  let totalItemsInWindow = 0;

  for (let w = 7; w >= 0; w--) {
    const weekStartKey = addDaysToDayKey(currentWeekSundayKey, -w * 7);
    const startDateObj = parseDayKey(weekStartKey);
    const monthShort = startDateObj.toLocaleDateString(undefined, { month: 'short' });
    const dayOfMonth = startDateObj.getUTCDate();

    let weekCompleted = 0;
    let weekRevised = 0;

    for (let d = 0; d < 7; d++) {
      const dayKey = addDaysToDayKey(weekStartKey, d);
      const log = dayLogs[dayKey];
      if (log) {
        weekCompleted += log.completed || 0;
        weekRevised += log.revised || 0;
      }
    }

    totalItemsInWindow += weekCompleted + weekRevised;

    weeksData.push({
      label: `${monthShort} ${dayOfMonth}`,
      fullDate: `Week of ${monthShort} ${dayOfMonth}, ${startDateObj.getUTCFullYear()}`,
      completed: weekCompleted,
      revised: weekRevised,
    });
  }

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Weekly Study Velocity</h2>
          <p className="text-xs text-muted-foreground">
            Items completed and revised per week over the last 8 weeks.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-pink" />
            <span className="text-muted-foreground">Revised</span>
          </div>
        </div>
      </div>

      {totalItemsInWindow === 0 ? (
        <div className="h-48 rounded-2xl border border-dashed border-border bg-surface-2/20 flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground/80 mb-1">No Activity in the Last 8 Weeks</p>
          <p className="max-w-xs">
            Start checking off topics or practice problems to track your weekly learning volume.
          </p>
        </div>
      ) : (
        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeksData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as WeekData;
                    return (
                      <div className="rounded-xl bg-surface-2 border border-border p-3 text-xs shadow-xl space-y-1">
                        <div className="font-semibold text-foreground">{data.fullDate}</div>
                        <div className="text-primary font-mono">
                          Completed: <span className="font-bold">{data.completed}</span> items
                        </div>
                        {data.revised > 0 && (
                          <div className="text-accent-pink font-mono">
                            Revised: <span className="font-bold">{data.revised}</span> items
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="revised" fill="hsl(var(--accent-pink))" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
