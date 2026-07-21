// src/components/dashboard/analytics/TopAttendeesCard.jsx
//
// The top-attendees leaderboard: ranked by turnout, with attendance and
// on-time rates. Self-fetching from /dashboard/admin/top-attendees.
import PropTypes from "prop-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetTopAttendees } from "@/hooks/useAdminAnalytics";
import AnalyticsCard from "./AnalyticsCard";
import { fmtInt, fmtPercent } from "./analytics-format";
import { cn } from "@/lib/utils";

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const rankClass = (rank) =>
  rank === 1
    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    : rank === 2
      ? "bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
      : rank === 3
        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
        : "bg-muted text-muted-foreground";

const TopAttendeesCard = ({ dateRange }) => {
  const { data, isLoading, isError, error, refetch } = useGetTopAttendees(dateRange);
  const leaderboard = data?.data?.leaderboard ?? [];

  return (
    <AnalyticsCard
      eyebrow="Engagement"
      title="Top attendees"
      subtitle="Most consistent turnout this period"
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={leaderboard.length === 0}
      minHeight={320}
    >
      <ul className="divide-y divide-border">
        {leaderboard.map((person) => (
          <li key={person.userId} className="flex items-center gap-3 py-2.5">
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold", rankClass(person.rank))}>
              {person.rank}
            </span>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={person.profilePicture || undefined} alt={person.name} />
              <AvatarFallback className="text-[10px]">{initials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {fmtInt(person.attended)} attended · {fmtPercent(person.onTimeRate)} on time
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-sm font-semibold text-foreground">{fmtPercent(person.attendanceRate)}</p>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">rate</p>
            </div>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
};

TopAttendeesCard.propTypes = { dateRange: PropTypes.object };

export default TopAttendeesCard;
