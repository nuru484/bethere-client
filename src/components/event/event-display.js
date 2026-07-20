// src/components/event/event-display.js
//
// Presentation-only helpers shared by the event card grid and detail view:
// text-only meta lines (the landing's departures-board voice) and a derived
// status chip. No business rules live here - status is a pure read of the
// event's own dates.

const DAY_MS = 24 * 60 * 60 * 1000;

const shortDate = (date, withYear) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });

/** "Aug 12, 2026" or "Aug 12 - Aug 15, 2026" (years only where needed). */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate) return "Date TBA";

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "Date TBA";

  const end = endDate ? new Date(endDate) : null;
  const hasEnd =
    end &&
    !Number.isNaN(end.getTime()) &&
    end.toDateString() !== start.toDateString();

  if (!hasEnd) return shortDate(start, true);

  const sameYear = start.getFullYear() === end.getFullYear();
  return `${shortDate(start, !sameYear)} - ${shortDate(end, true)}`;
};

/** "06:00 - 19:30", "From 06:00", or null when no times are set. */
export const formatTimeWindow = (startTime, endTime) => {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return `From ${startTime}`;
  return null;
};

const STATUS_CLASSES = {
  recurring: "bg-[#dcf5e9] text-[#1d8a5a]",
  live: "bg-[#3ecf8e] text-[#0b3b26]",
  upcoming: "bg-secondary text-secondary-foreground",
  ended: "bg-secondary text-muted-foreground",
};

/**
 * Derive a display status from the event's dates. Recurring events roll
 * forever, so they get their own chip instead of a window-based one.
 * Returns { label, className } for a mono uppercase chip.
 */
export const getEventStatus = (event) => {
  if (event?.isRecurring) {
    return { label: "Recurring", className: STATUS_CLASSES.recurring };
  }

  const start = event?.startDate ? new Date(event.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return { label: "Scheduled", className: STATUS_CLASSES.upcoming };
  }

  const end = event?.endDate ? new Date(event.endDate) : start;
  // Treat the end date as inclusive: the event runs until that day is over.
  const endOfEndDay =
    new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() +
    DAY_MS;
  const now = Date.now();

  if (now < start.getTime()) {
    return { label: "Upcoming", className: STATUS_CLASSES.upcoming };
  }
  if (now >= endOfEndDay) {
    return { label: "Ended", className: STATUS_CLASSES.ended };
  }
  return { label: "Live", className: STATUS_CLASSES.live };
};
