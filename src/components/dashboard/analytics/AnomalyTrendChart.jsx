// src/components/dashboard/analytics/AnomalyTrendChart.jsx
//
// Anomaly volume over time, stacked by type. Self-fetching from
// /dashboard/admin/anomaly-trend.
import PropTypes from "prop-types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useGetAnomalyTrend } from "@/hooks/useAdminAnalytics";
import { ANOMALY_TYPE_COLOR } from "@/lib/chart-colors";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt, formatBucketLabel } from "./analytics-format";

const TYPES = [
  { key: "duplicateDescriptor", name: "Duplicate", color: ANOMALY_TYPE_COLOR.duplicateDescriptor },
  { key: "livenessFailed", name: "Liveness failed", color: ANOMALY_TYPE_COLOR.livenessFailed },
  { key: "replaySuspected", name: "Replay", color: ANOMALY_TYPE_COLOR.replaySuspected },
  { key: "rapidAttempts", name: "Rapid attempts", color: ANOMALY_TYPE_COLOR.rapidAttempts },
];

const AnomalyTrendChart = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetAnomalyTrend(dateRange);
  const series = data?.data?.timeSeries ?? [];
  const hasData = series.some((point) => point.total > 0);

  return (
    <AnalyticsCard
      eyebrow="Integrity"
      title="Anomalies over time"
      subtitle="Flagged attempts by type"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!hasData}
      emptyTitle="No anomalies"
      emptyDescription="No suspicious check-in attempts were flagged in this period."
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tickFormatter={formatBucketLabel} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" minTickGap={16} />
          <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <Tooltip content={<ChartTooltip labelFormatter={formatBucketLabel} valueFormatter={fmtInt} hideZero />} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          {TYPES.map((type) => (
            <Area
              key={type.key}
              type="monotone"
              dataKey={type.key}
              name={type.name}
              stackId="a"
              stroke={type.color}
              fill={type.color}
              fillOpacity={0.25}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  );
};

AnomalyTrendChart.propTypes = { dateRange: PropTypes.object };

export default AnomalyTrendChart;
