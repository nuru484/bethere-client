// src/components/dashboard/analytics/HeroKpis.jsx
//
// The admin dashboard's hero KPI row: presence, punctuality, and integrity
// headline metrics with trends. Self-fetching from /dashboard/admin/kpis.
import PropTypes from "prop-types";
import { UserCheck, Clock, Users, AlarmClock, ShieldAlert, ScanFace, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetAdminKpis } from "@/hooks/useAdminAnalytics";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import KpiCard from "./KpiCard";
import { fmtInt, fmtKpi } from "./analytics-format";

// Icon + accent per metric; the metric key matches the API's kpis object.
const CARD_META = {
  attendanceRate: {
    icon: UserCheck,
    label: "Attendance rate",
    accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
    meta: (m) => `${fmtInt(m.present)} present · ${fmtInt(m.late)} late · ${fmtInt(m.absent)} absent`,
  },
  punctualityRate: {
    icon: Clock,
    label: "On-time rate",
    accent: "bg-sky-100 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400",
    meta: (m) => `${fmtInt(m.present)} on time of ${fmtInt(m.showed)}`,
  },
  uniqueAttendees: {
    icon: Users,
    label: "Unique attendees",
    accent: "bg-violet-100 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400",
  },
  avgLateness: {
    icon: AlarmClock,
    label: "Avg lateness",
    accent: "bg-amber-100 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
  },
  anomalies: {
    icon: ShieldAlert,
    label: "Anomalies",
    accent: "bg-rose-100 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400",
    meta: (m) => `${fmtInt(m.open)} open`,
  },
  enrollmentCoverage: {
    icon: ScanFace,
    label: "Enrollment",
    accent: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/25 dark:text-indigo-400",
    meta: (m) => `${fmtInt(m.enrolled)}/${fmtInt(m.totalUsers)} enrolled`,
  },
};

const ORDER = [
  "attendanceRate",
  "punctualityRate",
  "uniqueAttendees",
  "avgLateness",
  "anomalies",
  "enrollmentCoverage",
];

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6";

const HeroKpis = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetAdminKpis(dateRange);

  if (isLoading) {
    return (
      <div className={GRID}>
        {ORDER.map((key) => (
          <Skeleton key={key} className="h-[112px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="h-7 w-7 text-destructive/70" />
        <p className="text-sm text-muted-foreground">{extractApiErrorMessage(error).message}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </Card>
    );
  }

  const kpis = data?.data?.kpis ?? {};

  return (
    <div className={GRID}>
      {ORDER.map((key) => {
        const metric = kpis[key];
        const meta = CARD_META[key];
        if (!metric || !meta) return null;
        return (
          <KpiCard
            key={key}
            icon={meta.icon}
            label={meta.label}
            accent={meta.accent}
            value={fmtKpi(metric.value, metric.unit)}
            trend={metric.trend}
            inverse={metric.inverse}
            meta={meta.meta && metric.meta ? meta.meta(metric.meta) : undefined}
          />
        );
      })}
    </div>
  );
};

HeroKpis.propTypes = {
  dateRange: PropTypes.object,
};

export default HeroKpis;
