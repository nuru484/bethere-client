// src/components/dashboard/analytics/RetentionCurveCard.jsx
//
// The recurring-event retention curve: of the cohort that attended occurrence
// 1, what fraction returns for each later occurrence. A per-event selector
// drives the query; retention is occurrence-based, so it ignores the dashboard
// date range. Self-fetching from /dashboard/admin/retention-curve.
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRetentionCurve } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import ChartTooltip from "./ChartTooltip";
import { fmtInt, fmtPercent } from "./analytics-format";

const RetentionCurveCard = () => {
  const [eventId, setEventId] = useState(undefined);
  const { data, isLoading, isError, error, refetch } = useGetRetentionCurve(
    eventId ? { eventId } : {}
  );
  const payload = data?.data;
  const occurrences = payload?.occurrences ?? [];
  const available = payload?.availableEvents ?? [];
  const cohortSize = payload?.cohortSize ?? 0;

  const selector =
    available.length > 0 ? (
      <Select
        value={eventId ? String(eventId) : payload?.event ? String(payload.event.id) : undefined}
        onValueChange={(value) => setEventId(Number(value))}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs sm:w-[180px]">
          <SelectValue placeholder="Choose event" />
        </SelectTrigger>
        <SelectContent>
          {available.map((event) => (
            <SelectItem key={event.id} value={String(event.id)} className="text-xs">
              {event.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  return (
    <AnalyticsCard
      eyebrow="Engagement"
      title="Retention curve"
      subtitle={payload?.event ? `${payload.event.title} · cohort of ${fmtInt(cohortSize)}` : "Recurring-event cohort retention"}
      action={selector}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={occurrences.length === 0}
      emptyTitle="No recurring events"
      emptyDescription="Retention needs a recurring event with recorded occurrences."
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={occurrences} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="occurrence"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
            tickFormatter={(value) => `#${value}`}
          />
          <YAxis domain={[0, 100]} unit="%" width={40} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={(value) => `Occurrence #${value}`}
                valueFormatter={(value, entry) =>
                  entry.dataKey === "retentionRate" ? fmtPercent(value) : fmtInt(value)
                }
              />
            }
          />
          <ReferenceLine y={100} stroke="hsl(var(--border))" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="retentionRate" name="Retention" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  );
};

export default RetentionCurveCard;
