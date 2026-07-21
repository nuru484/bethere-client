// src/components/dashboard/analytics/IntegrityScoreCard.jsx
//
// The composite Presence Integrity Score - BeThere's signature metric. A radial
// gauge with the grade, the transparent component breakdown that produced it,
// and the underlying integrity summary. Self-fetching from
// /dashboard/admin/integrity-summary.
import PropTypes from "prop-types";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { ShieldCheck } from "lucide-react";
import { useGetIntegritySummary } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import { fmtInt, fmtPercent, gradeColor } from "./analytics-format";

const scoreColor = (value) => {
  if (value >= 80) return "hsl(var(--chart-1))";
  if (value >= 60) return "#f59e0b";
  return "hsl(var(--destructive))";
};

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-border p-2.5">
    <p className="font-mono text-[9px] uppercase tracking-tight text-muted-foreground">{label}</p>
    <p className="mt-0.5 font-display text-base font-semibold text-foreground">{value}</p>
  </div>
);

Stat.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
};

const IntegrityScoreCard = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetIntegritySummary(dateRange);
  const payload = data?.data;
  const score = payload?.integrityScore?.score ?? 0;
  const grade = payload?.integrityScore?.grade ?? "—";
  const components = payload?.integrityScore?.components ?? [];
  const summary = payload?.summary ?? {};

  return (
    <AnalyticsCard
      eyebrow="Integrity"
      title="Presence Integrity Score"
      subtitle="Verified-presence health for the period"
      action={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      minHeight={360}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* gauge */}
        <div className="relative mx-auto h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: score }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} fill={scoreColor(score)} isAnimationActive={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold leading-none text-foreground">{fmtInt(score)}</span>
            <span className={`mt-1 font-mono text-sm font-bold ${gradeColor(grade)}`}>Grade {grade}</span>
          </div>
        </div>

        {/* components */}
        <div className="flex-1 space-y-3">
          {components.map((component) => (
            <div key={component.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{component.label}</span>
                <span className="font-mono font-semibold text-foreground">
                  {fmtPercent(component.value, component.value % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${component.value}%`, backgroundColor: scoreColor(component.value) }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">weight {Math.round(component.weight * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-3">
        <Stat label="Anomalies" value={fmtInt(summary.totalAnomalies)} />
        <Stat label="Open" value={fmtInt(summary.openAnomalies)} />
        <Stat label="Resolved" value={fmtPercent(summary.resolutionRate ?? 0)} />
        <Stat label="MTTR" value={`${summary.mttrHours ?? 0}h`} />
        <Stat label="Anomaly rate" value={fmtPercent(summary.anomalyRate ?? 0, 1)} />
        <Stat label="Avg liveness" value={(summary.avgLivenessScore ?? 0).toFixed(2)} />
      </div>
    </AnalyticsCard>
  );
};

IntegrityScoreCard.propTypes = { dateRange: PropTypes.object };

export default IntegrityScoreCard;
