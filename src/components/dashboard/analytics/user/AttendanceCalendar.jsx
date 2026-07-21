// src/components/dashboard/analytics/user/AttendanceCalendar.jsx
//
// A GitHub-style attendance calendar: one cell per day over the last ~26
// weeks, coloured by the best status the attendant achieved that day. Fetches
// its own fixed window (independent of the dashboard date range) so it always
// shows a full, consistent calendar. Scrolls horizontally on small screens.
import { useMemo } from "react";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { useGetUserCalendar } from "@/hooks/useUserAnalytics";
import AnalyticsCard from "../AnalyticsCard";
import { fmtInt } from "../analytics-format";

const WEEKS = 26;

const statusColor = (status) => {
  if (status === "present") return "hsl(var(--chart-1))";
  if (status === "late") return "hsl(var(--chart-4))";
  if (status === "absent") return "hsl(var(--destructive) / 0.55)";
  return "hsl(var(--muted) / 0.5)"; // no record
};

const AttendanceCalendar = () => {
  const today = useMemo(() => new Date(), []);
  const params = useMemo(
    () => ({
      startDate: format(subDays(today, WEEKS * 7), "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    }),
    [today]
  );

  const { data, isLoading, isError, error, refetch } = useGetUserCalendar(params);
  const days = useMemo(() => data?.data?.days ?? [], [data]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const columns = useMemo(() => {
    const gridStart = startOfWeek(subDays(today, WEEKS * 7), { weekStartsOn: 0 });
    const cols = [];
    let cursor = gridStart;
    while (cursor <= today) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        week.push(cursor);
        cursor = addDays(cursor, 1);
      }
      cols.push(week);
    }
    return cols;
  }, [today]);

  const summary = days.reduce(
    (acc, day) => {
      acc[day.status] = (acc[day.status] || 0) + 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 }
  );

  const monthLabel = (colIndex) => {
    const first = columns[colIndex][0];
    const prevFirst = colIndex > 0 ? columns[colIndex - 1][0] : null;
    if (!prevFirst || first.getMonth() !== prevFirst.getMonth()) return format(first, "MMM");
    return "";
  };

  return (
    <AnalyticsCard
      eyebrow="Consistency"
      title="Attendance calendar"
      subtitle={`Your last ${WEEKS} weeks · ${fmtInt(summary.present + summary.late)} attended`}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      minHeight={220}
    >
      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* month labels */}
          <div className="mb-1 flex gap-[3px] pl-0">
            {columns.map((_, index) => (
              <div key={index} className="w-[13px] font-mono text-[9px] text-muted-foreground">
                {monthLabel(index)}
              </div>
            ))}
          </div>
          {/* week columns */}
          <div className="flex gap-[3px]">
            {columns.map((week, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[3px]">
                {week.map((date) => {
                  const future = date > today;
                  const key = format(date, "yyyy-MM-dd");
                  const rec = byDate.get(key);
                  return (
                    <div
                      key={key}
                      title={future ? "" : `${format(date, "EEE, MMM d")} · ${rec ? rec.status : "no session"}`}
                      className="h-[13px] w-[13px] rounded-[3px] border border-border/40"
                      style={{ backgroundColor: future ? "transparent" : statusColor(rec?.status), borderColor: future ? "transparent" : undefined }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: statusColor("present") }} /> Present ({fmtInt(summary.present)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: statusColor("late") }} /> Late ({fmtInt(summary.late)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: statusColor("absent") }} /> Absent ({fmtInt(summary.absent)})
        </span>
      </div>
    </AnalyticsCard>
  );
};

export default AttendanceCalendar;
