// src/components/dashboard/analytics/user/UserAttendanceTrend.jsx
//
// The attendant's personal attendance time series (present/late/absent with a
// rate line). Self-fetching from /dashboard/users/attendance-trend.
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
import { useGetUserAttendanceTrend } from "@/hooks/useUserAnalytics";
import { ANALYTICS_STATUS } from "@/lib/chart-colors";
import AnalyticsCard from "../AnalyticsCard";
import ChartTooltip from "../ChartTooltip";
import { fmtInt, fmtPercent, formatBucketLabel } from "../analytics-format";

const UserAttendanceTrend = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetUserAttendanceTrend(dateRange);
  const series = data?.data?.timeSeries ?? [];
  const hasData = series.some((point) => point.total > 0);

  return (
    <AnalyticsCard
      eyebrow="My activity"
      title="My attendance over time"
      subtitle="Your present, late, and absent sessions"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!hasData}
      emptyTitle="No attendance yet"
      emptyDescription="Your attendance will chart here once you start checking in."
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="userPresentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ANALYTICS_STATUS.present} stopOpacity={0.4} />
              <stop offset="100%" stopColor={ANALYTICS_STATUS.present} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tickFormatter={formatBucketLabel} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" minTickGap={16} />
          <YAxis yAxisId="count" allowDecimals={false} width={32} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} unit="%" width={40} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={formatBucketLabel}
                valueFormatter={(value, entry) => (entry.dataKey === "attendanceRate" ? fmtPercent(value, 1) : fmtInt(value))}
              />
            }
          />
          <Area yAxisId="count" type="monotone" dataKey="present" name="Present" stackId="a" stroke={ANALYTICS_STATUS.present} fill="url(#userPresentFill)" strokeWidth={2} isAnimationActive={false} />
          <Area yAxisId="count" type="monotone" dataKey="late" name="Late" stackId="a" stroke={ANALYTICS_STATUS.late} fill={ANALYTICS_STATUS.late} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
          <Area yAxisId="count" type="monotone" dataKey="absent" name="Absent" stackId="a" stroke={ANALYTICS_STATUS.absent} fill={ANALYTICS_STATUS.absent} fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
          <Line yAxisId="rate" type="monotone" dataKey="attendanceRate" name="Attendance rate" stroke={ANALYTICS_STATUS.rate} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  );
};

UserAttendanceTrend.propTypes = { dateRange: PropTypes.object };

export default UserAttendanceTrend;
