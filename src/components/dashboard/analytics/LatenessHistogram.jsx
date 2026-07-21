// src/components/dashboard/analytics/LatenessHistogram.jsx
//
// Distribution of arrival lateness across the checked-in population, as a
// coloured histogram (green "on time" ramping to red for the worst bin).
import PropTypes from "prop-types";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGetLatenessDistribution } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt } from "./analytics-format";

// On-time green -> deepening amber/red for later bins.
const BIN_COLORS = ["hsl(var(--chart-1))", "#facc15", "#f59e0b", "#f97316", "#ef4444", "#b91c1c"];

const LatenessHistogram = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetLatenessDistribution(dateRange);
  const segments = data?.data?.segments ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <AnalyticsCard
      eyebrow="Punctuality"
      title="Lateness distribution"
      subtitle={`How late arrivals are · ${fmtInt(total)} check-ins`}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={total === 0}
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={segments} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" interval={0} />
          <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            content={<ChartTooltip valueFormatter={(value, entry) => `${fmtInt(value)} · ${entry.payload.percentage}%`} />}
          />
          <Bar dataKey="count" name="Check-ins" radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false}>
            {segments.map((segment, index) => (
              <Cell key={segment.key} fill={BIN_COLORS[index % BIN_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  );
};

LatenessHistogram.propTypes = { dateRange: PropTypes.object };

export default LatenessHistogram;
