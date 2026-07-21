// src/components/dashboard/analytics/LivenessQualityCard.jsx
//
// Liveness-quality distributions for flagged attempts: the liveness-score
// histogram and the match-distance histogram (lower distance = closer face
// match; 0.6 is the accept threshold). Self-fetching from
// /dashboard/admin/liveness-quality.
import PropTypes from "prop-types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGetLivenessQuality } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt } from "./analytics-format";

const MiniHistogram = ({ title, average, count, bins, fill }) => (
  <div>
    <div className="mb-1 flex items-baseline justify-between">
      <p className="font-mono text-[10px] uppercase tracking-tight text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">
        avg <span className="font-mono font-semibold text-foreground">{average.toFixed(2)}</span> · {fmtInt(count)}
      </p>
    </div>
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={bins} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" interval={0} />
        <YAxis allowDecimals={false} width={28} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
        <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} content={<ChartTooltip valueFormatter={fmtInt} />} />
        <Bar dataKey="count" name="Count" fill={fill} radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

MiniHistogram.propTypes = {
  title: PropTypes.string,
  average: PropTypes.number,
  count: PropTypes.number,
  bins: PropTypes.array,
  fill: PropTypes.string,
};

const LivenessQualityCard = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetLivenessQuality(dateRange);
  const livenessScore = data?.data?.livenessScore ?? { count: 0, average: 0, bins: [] };
  const matchDistance = data?.data?.matchDistance ?? { count: 0, average: 0, bins: [] };
  const isEmpty = (livenessScore.count ?? 0) === 0 && (matchDistance.count ?? 0) === 0;

  return (
    <AnalyticsCard
      eyebrow="Integrity"
      title="Liveness quality"
      subtitle="Verification quality of flagged evidence"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyTitle="No evidence retained"
      emptyDescription="Evidence frames are kept only for flagged attempts; none in this period."
      minHeight={340}
    >
      <div className="space-y-5">
        <MiniHistogram
          title="Liveness score"
          average={livenessScore.average ?? 0}
          count={livenessScore.count ?? 0}
          bins={livenessScore.bins ?? []}
          fill="hsl(var(--chart-1))"
        />
        <MiniHistogram
          title="Match distance (lower = closer)"
          average={matchDistance.average ?? 0}
          count={matchDistance.count ?? 0}
          bins={matchDistance.bins ?? []}
          fill="#7c3aed"
        />
      </div>
    </AnalyticsCard>
  );
};

LivenessQualityCard.propTypes = { dateRange: PropTypes.object };

export default LivenessQualityCard;
