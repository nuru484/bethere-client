// src/components/dashboard/analytics/ArrivalHeatmap.jsx
//
// The arrival-time heatmap: check-in volume by venue day-of-week x hour. A
// custom grid (not Recharts) - cell opacity scales with volume against the
// busiest cell. Only the active hour span is rendered so it stays compact, and
// the grid scrolls horizontally on small screens.
import PropTypes from "prop-types";
import { useGetArrivalHeatmap } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import { fmtInt } from "./analytics-format";

// Monday-first, mapping to the SQL DOW (0 = Sunday).
const DAYS = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

const ArrivalHeatmap = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetArrivalHeatmap(dateRange);
  const cells = data?.data?.cells ?? [];
  const maxCount = data?.data?.maxCount ?? 0;
  const total = data?.data?.total ?? 0;

  const counts = new Map();
  let minHour = 23;
  let maxHour = 0;
  for (const cell of cells) {
    counts.set(`${cell.dow}-${cell.hour}`, cell.count);
    minHour = Math.min(minHour, cell.hour);
    maxHour = Math.max(maxHour, cell.hour);
  }
  if (minHour > maxHour) {
    minHour = 7;
    maxHour = 18;
  }
  const hours = [];
  for (let h = minHour; h <= maxHour; h += 1) hours.push(h);

  const gridTemplateColumns = `2.6rem repeat(${hours.length}, minmax(1.4rem, 1fr))`;

  return (
    <AnalyticsCard
      eyebrow="Punctuality"
      title="Arrival heatmap"
      subtitle={`When people check in · ${fmtInt(total)} arrivals`}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={total === 0}
      minHeight={300}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[440px] space-y-1">
          {/* hour axis */}
          <div className="grid items-end gap-1" style={{ gridTemplateColumns }}>
            <span />
            {hours.map((hour) => (
              <span key={hour} className="text-center font-mono text-[9px] text-muted-foreground">
                {String(hour).padStart(2, "0")}
              </span>
            ))}
          </div>
          {DAYS.map((day) => (
            <div key={day.dow} className="grid items-center gap-1" style={{ gridTemplateColumns }}>
              <span className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
                {day.label}
              </span>
              {hours.map((hour) => {
                const count = counts.get(`${day.dow}-${hour}`) ?? 0;
                const alpha = count > 0 && maxCount > 0 ? 0.15 + 0.85 * (count / maxCount) : 0;
                return (
                  <div
                    key={hour}
                    title={`${day.label} ${String(hour).padStart(2, "0")}:00 · ${count} check-in${count === 1 ? "" : "s"}`}
                    className="aspect-square rounded-[3px] border border-border/40"
                    style={{
                      backgroundColor: count > 0 ? `hsl(var(--chart-1) / ${alpha})` : "hsl(var(--muted) / 0.5)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.15, 0.4, 0.65, 0.9].map((a) => (
          <span
            key={a}
            className="h-3 w-3 rounded-[3px] border border-border/40"
            style={{ backgroundColor: `hsl(var(--chart-1) / ${a})` }}
          />
        ))}
        <span>More</span>
      </div>
    </AnalyticsCard>
  );
};

ArrivalHeatmap.propTypes = { dateRange: PropTypes.object };

export default ArrivalHeatmap;
