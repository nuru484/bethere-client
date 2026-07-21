// src/components/dashboard/analytics/LiveStrip.jsx
//
// The live operational strip - "what is happening on the floor right now".
// Never date-filtered; refetches every minute. The open-anomalies tile links
// straight into the review queue so a flagged attempt is one click from triage.
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Radio, UserCheck, LogIn, AlarmClock, ShieldAlert, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminLiveSnapshot } from "@/hooks/useAdminAnalytics";
import { fmtInt } from "./analytics-format";
import { cn } from "@/lib/utils";

const Tile = ({ icon: Icon, value, label, sub, tone = "default", to, pulse }) => {
  const toneClass =
    tone === "alert"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "live"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";

  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className={cn("relative flex items-center", toneClass)}>
          <Icon className="h-4 w-4" />
          {pulse && (
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </span>
        <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{label}</p>
        {to && <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      <p className={cn("mt-2 font-display text-2xl font-semibold leading-none", toneClass)}>{fmtInt(value)}</p>
      {sub && <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>}
    </>
  );

  const className = cn(
    "rounded-xl border border-border p-3",
    to && "group transition-colors hover:border-foreground/20 hover:bg-muted/40"
  );

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
};

Tile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  value: PropTypes.number,
  label: PropTypes.string,
  sub: PropTypes.string,
  tone: PropTypes.oneOf(["default", "alert", "live"]),
  to: PropTypes.string,
  pulse: PropTypes.bool,
};

const LiveStrip = () => {
  const { data, isLoading, isError } = useGetAdminLiveSnapshot();

  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  // The live strip is best-effort context; on error it simply hides rather
  // than pushing an error card above the whole dashboard.
  if (isError || !data?.data) return null;

  const s = data.data;
  const hasHigh = s.highSeverityOpenAnomalies > 0;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            Live now
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          as of {format(new Date(s.asOf), "HH:mm")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile
          icon={Radio}
          value={s.sessionsLiveNow}
          label="Live sessions"
          sub={`${fmtInt(s.sessionsToday)} scheduled today`}
          tone={s.sessionsLiveNow > 0 ? "live" : "default"}
          pulse={s.sessionsLiveNow > 0}
        />
        <Tile
          icon={UserCheck}
          value={s.checkedInNow}
          label="Checked in now"
          sub="on the floor"
        />
        <Tile
          icon={LogIn}
          value={s.checkInsToday}
          label="Check-ins today"
          sub={`${fmtInt(s.presentToday)} present · ${fmtInt(s.lateToday)} late`}
        />
        <Tile icon={AlarmClock} value={s.lateToday} label="Late today" />
        <Tile
          icon={ShieldAlert}
          value={s.openAnomalies}
          label="Open anomalies"
          sub={hasHigh ? `${fmtInt(s.highSeverityOpenAnomalies)} high severity` : "review queue"}
          tone={s.openAnomalies > 0 ? "alert" : "default"}
          to="/dashboard/review"
        />
      </div>
    </Card>
  );
};

export default LiveStrip;
