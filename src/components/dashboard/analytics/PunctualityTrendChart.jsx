// src/components/dashboard/analytics/PunctualityTrendChart.jsx
//
// On-time vs late over time (stacked bars) with the mean-lateness line on a
// second axis. Self-fetching from /dashboard/admin/punctuality-trend.
import PropTypes from "prop-types";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetPunctualityTrend } from "@/hooks/useAdminAnalytics";
import { ANALYTICS_STATUS } from "@/lib/chart-colors";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt, fmtMinutes, formatBucketLabel } from "./analytics-format";

const PunctualityTrendChart = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetPunctualityTrend(dateRange);
  const series = data?.data?.timeSeries ?? [];
  const hasData = series.some((point) => point.onTime + point.late > 0);

  return (
    <AnalyticsCard
      eyebrow="Punctuality"
      title="On time vs late"
      subtitle="Arrivals per period, with the mean-lateness line"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!hasData}
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={formatBucketLabel}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
            minTickGap={16}
          />
          <YAxis yAxisId="count" allowDecimals={false} width={36} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <YAxis yAxisId="min" orientation="right" width={44} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            content={
              <ChartTooltip
                labelFormatter={formatBucketLabel}
                valueFormatter={(value, entry) =>
                  entry.dataKey === "avgLateness" ? fmtMinutes(value) : fmtInt(value)
                }
              />
            }
          />
          <Bar yAxisId="count" dataKey="onTime" name="On time" stackId="a" fill={ANALYTICS_STATUS.onTime} radius={[0, 0, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          <Bar yAxisId="count" dataKey="late" name="Late" stackId="a" fill={ANALYTICS_STATUS.late} radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          <Line yAxisId="min" type="monotone" dataKey="avgLateness" name="Avg lateness" stroke="#d97706" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  );
};

PunctualityTrendChart.propTypes = { dateRange: PropTypes.object };

export default PunctualityTrendChart;
