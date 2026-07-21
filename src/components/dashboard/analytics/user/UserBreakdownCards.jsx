// src/components/dashboard/analytics/user/UserBreakdownCards.jsx
//
// Two small personal breakdowns: the attendant's status donut and their
// per-event attendance rate. Self-fetching from the user breakdown slices.
import PropTypes from "prop-types";
import { useGetUserStatusBreakdown, useGetUserEventBreakdown } from "@/hooks/useUserAnalytics";
import { ANALYTICS_STATUS, CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import AnalyticsCard from "../AnalyticsCard";
import DonutBreakdown from "../DonutBreakdown";
import RankedBarList from "../RankedBarList";
import { fmtPercent } from "../analytics-format";

const STATUS_COLORS = {
  PRESENT: ANALYTICS_STATUS.present,
  LATE: ANALYTICS_STATUS.late,
  ABSENT: ANALYTICS_STATUS.absent,
};

export const UserStatusDonut = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetUserStatusBreakdown(dateRange);
  const segments = data?.data?.segments ?? [];
  const total = segments.reduce((sum, segment) => sum + (segment.count || 0), 0);

  return (
    <AnalyticsCard
      eyebrow="My activity"
      title="My status breakdown"
      subtitle="Present · late · absent"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={total === 0}
      emptyTitle="No attendance yet"
      minHeight={340}
    >
      <DonutBreakdown segments={segments} colorFor={(key, i) => STATUS_COLORS[key] ?? CATEGORICAL_PALETTE[i]} />
    </AnalyticsCard>
  );
};

UserStatusDonut.propTypes = { dateRange: PropTypes.object };

export const UserEventBreakdown = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetUserEventBreakdown(dateRange);
  const segments = data?.data?.segments ?? [];

  return (
    <AnalyticsCard
      eyebrow="My activity"
      title="My attendance by event"
      subtitle="Turnout rate per event you attend"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={segments.length === 0}
      emptyTitle="No attendance yet"
      minHeight={260}
    >
      <RankedBarList items={segments} sub={(item) => fmtPercent(item.attendanceRate ?? 0)} />
    </AnalyticsCard>
  );
};

UserEventBreakdown.propTypes = { dateRange: PropTypes.object };
