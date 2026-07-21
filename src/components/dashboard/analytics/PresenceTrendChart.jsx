// src/components/dashboard/analytics/PresenceTrendChart.jsx
//
// The presence time series: stacked present/late/absent areas with an
// attendance-rate line on a second axis and a dashed previous-period total
// overlay. Self-fetching from /dashboard/admin/presence-trend.
import PropTypes from "prop-types";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetPresenceTrend } from "@/hooks/useAdminAnalytics";
import { ANALYTICS_STATUS } from "@/lib/chart-colors";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt, fmtPercent, formatBucketLabel } from "./analytics-format";

const Stat = ({ label, value }) => (
  <div>
    <p className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground">{label}</p>
    <p className="font-display text-sm font-semibold text-foreground">{value}</p>
  </div>
);

Stat.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
};

const PresenceTrendChart = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetPresenceTrend(dateRange);
  const payload = data?.data;
  const series = payload?.timeSeries ?? [];
  const summary = payload?.summary ?? {};
  const hasData = (summary.total ?? 0) > 0;
  const hasPrevious = series.some((point) => point.previousTotal !== null && point.previousTotal !== undefined);

  return (
    <AnalyticsCard
      eyebrow="Presence"
      title="Attendance over time"
      subtitle="Present · late · absent, with the attendance-rate line"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!hasData}
      minHeight={320}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_STATUS.present} stopOpacity={0.4} />
              <stop offset="100%" stopColor={ANALYTICS_STATUS.present} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={formatBucketLabel}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
            minTickGap={16}
          />
          <YAxis
            yAxisId="count"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
            width={36}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
            width={40}
          />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={formatBucketLabel}
                valueFormatter={(value, entry) =>
                  entry.dataKey === "attendanceRate" ? fmtPercent(value, 1) : fmtInt(value)
                }
              />
            }
          />
          <Area yAxisId="count" type="monotone" dataKey="present" name="Present" stackId="a" stroke={ANALYTICS_STATUS.present} fill="url(#presentFill)" strokeWidth={2} isAnimationActive={false} />
          <Area yAxisId="count" type="monotone" dataKey="late" name="Late" stackId="a" stroke={ANALYTICS_STATUS.late} fill={ANALYTICS_STATUS.late} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
          <Area yAxisId="count" type="monotone" dataKey="absent" name="Absent" stackId="a" stroke={ANALYTICS_STATUS.absent} fill={ANALYTICS_STATUS.absent} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
          {hasPrevious && (
            <Line yAxisId="count" type="monotone" dataKey="previousTotal" name="Prev. total" stroke={ANALYTICS_STATUS.previous} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          )}
          <Line yAxisId="rate" type="monotone" dataKey="attendanceRate" name="Attendance rate" stroke={ANALYTICS_STATUS.rate} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        <Stat label="Attendance" value={fmtPercent(summary.attendanceRate ?? 0, 1)} />
        <Stat label="On time" value={fmtPercent(summary.punctualityRate ?? 0, 1)} />
        <Stat label="Total records" value={fmtInt(summary.total)} />
        <Stat label="Peak" value={summary.peakLabel ? formatBucketLabel(summary.peakLabel) : "—"} />
      </div>
    </AnalyticsCard>
  );
};

PresenceTrendChart.propTypes = {
  dateRange: PropTypes.object,
};

export default PresenceTrendChart;
