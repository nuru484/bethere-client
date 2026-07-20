// src/components/event/EventListItem.jsx
//
// One card in the events grid. The whole card navigates to the event detail
// page via a stretched overlay link - the Sign in / Sign out buttons are
// SIBLINGS of the link, not children, because interactive content inside an
// anchor is invalid HTML and hostile to keyboard and screen-reader users.
// Button state comes from the attendance fields embedded in the events list
// response (see useAttendanceActions) - no per-card fetching.
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
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
  const { isAttendant, showSignIn, showSignOut, wasAutoCheckedOut } =
    useAttendanceActions(event);

  const {
    id,
    title,
    type,
    coverImage,
    startDate,
    endDate,
    startTime,
    endTime,
  } = event;

  const status = getEventStatus(event);
  const dateRange = formatDateRange(startDate, endDate);
  const timeWindow = formatTimeWindow(startTime, endTime);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/30 focus-within:border-foreground/30">
      {/* Stretched link: keeps the whole-card tap target (important on
          phones) without nesting the buttons inside the anchor. */}
      <Link
        to={`/dashboard/events/${id}`}
        aria-label={`View event: ${title}`}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

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

        {/* Auto-checkout attribution: closed by the system, not the user */}
        {isAttendant && wasAutoCheckedOut && (
          <p className="mt-auto pt-4 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            Signed out by system
          </p>
        )}

        {/* Attendance actions (attendants only) - above the overlay link */}
        {isAttendant && (showSignIn || showSignOut) && (
          <div className="relative z-[2] mt-auto flex flex-wrap gap-2 pt-4">
            {showSignIn && (
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/dashboard/events/${id}/attendance-in`)
                }
              >
                Sign in
              </Button>
            )}
            {showSignOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/dashboard/events/${id}/attendance-out`)
                }
              >
                Sign out
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
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
    currentSession: PropTypes.shape({
      id: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
    }),
    viewerAttendance: PropTypes.shape({
      sessionId: PropTypes.number,
      status: PropTypes.string,
      checkInTime: PropTypes.string,
      checkOutTime: PropTypes.string,
      autoCheckedOut: PropTypes.bool,
    }),
  }).isRequired,
};

export default EventListItem;
