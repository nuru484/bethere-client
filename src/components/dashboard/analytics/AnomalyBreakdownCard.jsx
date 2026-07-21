// src/components/dashboard/analytics/AnomalyBreakdownCard.jsx
//
// Anomaly breakdown donut, by type or severity. Self-fetching from
// /dashboard/admin/anomaly-breakdown.
import PropTypes from "prop-types";
import { useGetAnomalyBreakdown } from "@/hooks/useAdminAnalytics";
import { ANOMALY_TYPE_COLOR, SEVERITY_COLOR, CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import AnalyticsCard from "./AnalyticsCard";
import DonutBreakdown from "./DonutBreakdown";

const TYPE_COLOR = {
  DUPLICATE_DESCRIPTOR: ANOMALY_TYPE_COLOR.duplicateDescriptor,
  LIVENESS_FAILED: ANOMALY_TYPE_COLOR.livenessFailed,
  REPLAY_SUSPECTED: ANOMALY_TYPE_COLOR.replaySuspected,
  RAPID_ATTEMPTS: ANOMALY_TYPE_COLOR.rapidAttempts,
};

const AnomalyBreakdownCard = ({ dateRange, by, title, subtitle }) => {
  const { data, isLoading, isError, error, refetch } = useGetAnomalyBreakdown({ by, ...dateRange });
  const segments = data?.data?.segments ?? [];
  const total = data?.data?.total ?? 0;

  const colorFor =
    by === "severity"
      ? (key) => SEVERITY_COLOR[key] ?? CATEGORICAL_PALETTE[0]
      : (key, index) => TYPE_COLOR[key] ?? CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];

  return (
    <AnalyticsCard
      eyebrow="Integrity"
      title={title}
      subtitle={subtitle}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={total === 0}
      emptyTitle="No anomalies"
      emptyDescription="No flagged attempts in this period - a clean record."
      minHeight={340}
    >
      <DonutBreakdown segments={segments} colorFor={colorFor} centerLabel="flags" />
    </AnalyticsCard>
  );
};

AnomalyBreakdownCard.propTypes = {
  dateRange: PropTypes.object,
  by: PropTypes.oneOf(["type", "severity"]).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export default AnomalyBreakdownCard;
