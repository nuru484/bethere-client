// src/components/dashboard/analytics/user/NowNextHero.jsx
//
// The attendant's "now / next" hero - the surface that turns the dashboard
// into an action. Shows the active check-in (with a check-out CTA), or the
// next session that is open right now (with a check-in CTA), or what's coming
// up. Self-fetching from /dashboard/users/now-next.
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CheckCircle2, LogIn, LogOut, CalendarClock, MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetUserNowNext } from "@/hooks/useUserAnalytics";

const timeLabel = (event) => `${event.startTime}–${event.endTime}`;

const Venue = ({ event }) =>
  event.location?.name ? (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <MapPin className="h-3.5 w-3.5" />
      {event.location.name}
      {event.location.city ? `, ${event.location.city}` : ""}
    </span>
  ) : null;

Venue.propTypes = { event: PropTypes.object };

const UpcomingRow = ({ item }) => (
  <Link
    to={`/dashboard/events/${item.event.id}`}
    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:border-foreground/20 hover:bg-muted/40"
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{item.event.title}</p>
      <p className="text-xs text-muted-foreground">
        {item.isToday ? "Today" : format(new Date(item.startDate), "EEE, MMM d")} · {timeLabel(item.event)}
      </p>
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
  </Link>
);

UpcomingRow.propTypes = { item: PropTypes.object };

const NowNextHero = () => {
  const { data, isLoading } = useGetUserNowNext();

  if (isLoading) {
    return <Skeleton className="h-[160px] w-full rounded-xl" />;
  }

  const payload = data?.data;
  const checkedIn = payload?.checkedIn;
  const next = payload?.next;
  const canCheckIn = payload?.canCheckIn;
  const upcoming = payload?.upcoming ?? [];

  // Priority: active check-in > open-now (check in) > up next > nothing.
  let hero;
  if (checkedIn) {
    hero = (
      <Card className="border-emerald-500/30 bg-emerald-50/60 p-5 dark:bg-emerald-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-tight text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-foreground">{checkedIn.event.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              since {format(new Date(checkedIn.checkInTime), "HH:mm")} · <Venue event={checkedIn.event} />
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link to={`/dashboard/events/${checkedIn.event.id}/attendance-out`}>
              <LogOut className="h-4 w-4" /> Check out
            </Link>
          </Button>
        </div>
      </Card>
    );
  } else if (canCheckIn && next) {
    hero = (
      <Card className="border-primary/30 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-tight text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Open now
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-foreground">{next.event.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {timeLabel(next.event)} · <Venue event={next.event} />
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link to={`/dashboard/events/${next.event.id}/attendance-in`}>
              <LogIn className="h-4 w-4" /> Check in
            </Link>
          </Button>
        </div>
      </Card>
    );
  } else if (next) {
    hero = (
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Up next
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-foreground">{next.event.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {next.isToday ? "Today" : format(new Date(next.startDate), "EEE, MMM d")} · {timeLabel(next.event)}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link to={`/dashboard/events/${next.event.id}`}>
              View event <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  } else {
    hero = (
      <Card className="p-5">
        <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" /> Up next
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-foreground">No upcoming sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">You have nothing scheduled right now. Check back later.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {hero}
      {upcoming.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {upcoming.map((item) => (
            <UpcomingRow key={item.sessionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NowNextHero;
