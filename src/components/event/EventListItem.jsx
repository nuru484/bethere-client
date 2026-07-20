// src/components/event/EventListItem.jsx
//
// One card in the events grid. The whole card is a link to the event detail
// page; the only buttons are Sign in / Sign out, mirroring the attendance
// logic used on the detail page. Edit/delete live on the detail page.
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { useGetUserEventAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/utils/getCurrentSession";
import { dotsLight } from "@/components/landing/texture";
import { PixelGlyph } from "@/components/landing/PixelGlyph";
import {
  formatDateRange,
  formatTimeWindow,
  getEventStatus,
} from "./event-display";

const GLYPH_NAMES = ["diamond", "checker", "bars", "stair", "funnel"];

const glyphFor = (id) => {
  const n = Number(id);
  return GLYPH_NAMES[Number.isFinite(n) ? Math.abs(n) % GLYPH_NAMES.length : 0];
};

const EventListItem = ({ event }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only USER-role principals are attendants: admins never see personal
  // sign-in / sign-out controls.
  const isAttendant = user?.role === "USER";

  const {
    id,
    title,
    type,
    coverImage,
    startDate,
    endDate,
    startTime,
    endTime,
    isRecurring,
  } = event;

  // Fetch user's attendance for this event
  const { data: userAttendanceData, isLoading: isLoadingAttendance } =
    useGetUserEventAttendance(user?.id, id, {
      limit: 100,
    });

  const userAttendances = userAttendanceData?.data || [];

  // Determine the current session for recurring events
  const currentSession = useMemo(() => {
    if (isRecurring) {
      return getCurrentSession(event);
    }
    return null;
  }, [event, isRecurring]);

  // Find attendance for the current session
  const currentSessionAttendance = currentSession
    ? userAttendances.find((att) => att.sessionId === currentSession.id)
    : null;

  // For non-recurring events, find the most recent attendance
  const latestAttendance =
    !isRecurring && userAttendances.length > 0
      ? userAttendances.reduce((latest, current) => {
          const latestTime = new Date(latest.checkInTime).getTime();
          const currentTime = new Date(current.checkInTime).getTime();
          return currentTime > latestTime ? current : latest;
        }, userAttendances[0])
      : null;

  // Determine sign-in/sign-out status based on event type
  let hasSignedIn, hasSignedOut, showSignInButton, showSignOutButton;

  if (isRecurring && currentSession) {
    // For recurring events: check current session attendance
    hasSignedIn = currentSessionAttendance?.checkInTime;
    hasSignedOut = currentSessionAttendance?.checkOutTime;

    showSignInButton = !hasSignedIn;
    showSignOutButton = hasSignedIn && !hasSignedOut;
  } else if (!isRecurring) {
    // For non-recurring events: check latest attendance
    hasSignedIn = latestAttendance?.checkInTime;
    hasSignedOut = latestAttendance?.checkOutTime;

    // Only show sign-in if user has never signed in
    showSignInButton = !hasSignedIn;
    // Only show sign-out if user has signed in but hasn't signed out yet
    showSignOutButton = hasSignedIn && !hasSignedOut;
  } else {
    // If recurring but no current session, show both buttons
    showSignInButton = true;
    showSignOutButton = true;
  }

  // Card-level buttons must not trigger the surrounding link.
  const handleAction = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(path);
  };

  const status = getEventStatus(event);
  const dateRange = formatDateRange(startDate, endDate);
  const timeWindow = formatTimeWindow(startTime, endTime);

  return (
    <Link
      to={`/dashboard/events/${id}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {/* Cover */}
      <div className="aspect-video w-full overflow-hidden border-b border-border bg-muted">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={dotsLight}
          >
            <PixelGlyph name={glyphFor(id)} className="w-20" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Micro-label row: type + status */}
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          <span className="truncate">{type}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 font-body text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>

        {/* Text-only meta */}
        <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          <p className="truncate">{dateRange}</p>
          {timeWindow && <p className="truncate">{timeWindow}</p>}
        </div>

        {/* Attendance actions (attendants only) */}
        {isAttendant && (showSignInButton || showSignOutButton) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {showSignInButton && (
              <Button
                size="sm"
                disabled={isLoadingAttendance}
                onClick={(e) =>
                  handleAction(e, `/dashboard/events/${id}/attendance-in`)
                }
              >
                Sign in
              </Button>
            )}
            {showSignOutButton && (
              <Button
                variant="outline"
                size="sm"
                disabled={isLoadingAttendance}
                onClick={(e) =>
                  handleAction(e, `/dashboard/events/${id}/attendance-out`)
                }
              >
                Sign out
              </Button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

EventListItem.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    coverImage: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    isRecurring: PropTypes.bool,
  }).isRequired,
};

export default EventListItem;
