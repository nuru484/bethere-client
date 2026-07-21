// src/components/dashboard/analytics/DonutBreakdown.jsx
//
// A donut with a centre total plus a detail list beneath it (colour dot,
// label, count, %). Presentational: the caller passes already-fetched
// segments. Zero-value slices are dropped from the ring but kept (dimmed) in
// the list so the categories stay visible.
import PropTypes from "prop-types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import { fmtInt } from "./analytics-format";

const DonutBreakdown = ({ segments, colorFor, centerLabel = "total", height = 200 }) => {
  const colored = segments.map((segment, index) => ({
    ...segment,
    color: colorFor ? colorFor(segment.key, index) : CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length],
  }));
  const total = colored.reduce((sum, segment) => sum + (segment.count || 0), 0);
  const ringData = colored.filter((segment) => (segment.count || 0) > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ringData}
              dataKey="count"
              nameKey="label"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {ringData.map((segment) => (
                <Cell key={segment.key} fill={segment.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-foreground">{fmtInt(total)}</span>
          <span className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {colored.map((segment) => (
          <li
            key={segment.key}
            className={`flex items-center justify-between gap-3 text-sm ${
              (segment.count || 0) === 0 ? "opacity-50" : ""
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate text-muted-foreground">{segment.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-mono font-semibold text-foreground">{fmtInt(segment.count)}</span>
              <span className="w-12 text-right text-xs text-muted-foreground">{segment.percentage ?? 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

DonutBreakdown.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
      percentage: PropTypes.number,
    })
  ).isRequired,
  colorFor: PropTypes.func,
  centerLabel: PropTypes.string,
  height: PropTypes.number,
};

export default DonutBreakdown;
