// src/components/dashboard/analytics/user/UserHeroKpis.jsx
//
// The attendant's personal KPI row: my attendance rate, on-time rate, sessions
// attended, and current streak. Self-fetching from /dashboard/users/kpis.
import PropTypes from "prop-types";
import { UserCheck, Clock, CalendarCheck, Flame, AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetUserKpis } from "@/hooks/useUserAnalytics";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import KpiCard from "../KpiCard";
import { fmtInt, fmtKpi } from "../analytics-format";

const CARD_META = {
  attendanceRate: {
    icon: UserCheck,
    label: "My attendance",
    accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
    meta: (m) => `${fmtInt(m.present)} present · ${fmtInt(m.late)} late · ${fmtInt(m.absent)} absent`,
  },
  onTimeRate: {
    icon: Clock,
    label: "On time",
    accent: "bg-sky-100 text-sky-600 dark:bg-sky-900/25 dark:text-sky-400",
    meta: (m) => `${fmtInt(m.present)} of ${fmtInt(m.attended)} attended`,
  },
  attended: {
    icon: CalendarCheck,
    label: "Sessions attended",
    accent: "bg-violet-100 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400",
    meta: (m) => `${fmtInt(m.present)} present · ${fmtInt(m.late)} late`,
  },
  currentStreak: {
    icon: Flame,
    label: "Current streak",
    accent: "bg-amber-100 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
    staticMeta: "sessions in a row",
  },
};

const ORDER = ["attendanceRate", "onTimeRate", "attended", "currentStreak"];
const GRID = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4";

const UserHeroKpis = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetUserKpis(dateRange);

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
          <RefreshCw className="h-4 w-4" /> Retry
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
            meta={meta.staticMeta ?? (meta.meta && metric.meta ? meta.meta(metric.meta) : undefined)}
          />
        );
      })}
    </div>
  );
};

UserHeroKpis.propTypes = { dateRange: PropTypes.object };

export default UserHeroKpis;
