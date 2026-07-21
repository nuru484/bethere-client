// src/components/dashboard/analytics/PresenceBreakdownCard.jsx
//
// A single presence breakdown, fetched by dimension (status | eventType |
// event | location). Statuses/types render as a donut; per-event and per-venue
// turnout render as ranked bars where a donut would be too busy.
import PropTypes from "prop-types";
import { useGetPresenceBreakdown } from "@/hooks/useAdminAnalytics";
import { ANALYTICS_STATUS, CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import AnalyticsCard from "./AnalyticsCard";
import DonutBreakdown from "./DonutBreakdown";
import RankedBarList from "./RankedBarList";
import { fmtPercent } from "./analytics-format";

const STATUS_COLORS = {
  PRESENT: ANALYTICS_STATUS.present,
  LATE: ANALYTICS_STATUS.late,
  ABSENT: ANALYTICS_STATUS.absent,
};

const statusColorFor = (key, index) => STATUS_COLORS[key] ?? CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];

const PresenceBreakdownCard = ({ dateRange, by, title, subtitle, variant = "donut" }) => {
  const { data, isLoading, isError, error, refetch } = useGetPresenceBreakdown({ by, ...dateRange });
  const segments = data?.data?.segments ?? [];
  const total = segments.reduce((sum, segment) => sum + (segment.count || 0), 0);

  return (
    <AnalyticsCard
      eyebrow="Presence"
      title={title}
      subtitle={subtitle}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={total === 0}
      minHeight={variant === "donut" ? 340 : 260}
    >
      {variant === "donut" ? (
        <DonutBreakdown segments={segments} colorFor={by === "status" ? statusColorFor : undefined} />
      ) : (
        <RankedBarList items={segments} sub={(item) => fmtPercent(item.attendanceRate ?? 0)} />
      )}
    </AnalyticsCard>
  );
};

PresenceBreakdownCard.propTypes = {
  dateRange: PropTypes.object,
  by: PropTypes.oneOf(["status", "eventType", "event", "location"]).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  variant: PropTypes.oneOf(["donut", "bars"]),
};

export default PresenceBreakdownCard;
