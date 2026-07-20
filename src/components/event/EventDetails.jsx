// src/components/event/EventDetails.jsx
//
// Detail card in the paper-and-ink voice: optional cover image, mono
// micro-label row (type + status), display title, then text-only meta
// sections - no decorative icons.
import PropTypes from "prop-types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEventStatus } from "./event-display";

const MICRO_LABEL =
  "font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground";

const EventDetails = ({ event }) => {
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified";

  const formatTime = (time) => time || "Not specified";

  if (!event) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-md py-8 text-center sm:py-12">
            <p className={MICRO_LABEL}>Not found</p>
            <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
              Event Not Found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              The event you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getEventStatus(event);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 lg:p-8">
        {/* Cover image */}
        {event.coverImage && (
          <img
            src={event.coverImage}
            alt=""
            className="mb-6 aspect-video w-full rounded-xl border border-border object-cover"
          />
        )}

        {/* Micro-label row: the page header owns the title, this card only
            carries type/status metadata and the description. */}
        <div className="mb-6 sm:mb-8">
          <div
            className={`flex flex-wrap items-center gap-2 ${MICRO_LABEL}`}
          >
            <span>{event.type}</span>
            <span
              className={`rounded-full px-2 py-0.5 ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {event.description && (
            <p className="mt-4 break-words text-base leading-relaxed text-muted-foreground sm:text-lg">
              {event.description}
            </p>
          )}
        </div>

        <Separator className="my-6 sm:my-8" />

        {/* Event details grid - text only, departures-board style */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Date & Time */}
          <div className="space-y-6">
            <div>
              <h3 className={`${MICRO_LABEL} mb-3`}>Date &amp; Time</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="w-12 flex-shrink-0 font-medium text-muted-foreground">
                    Start:
                  </span>
                  <span className="break-words font-medium text-foreground">
                    {formatDate(event.startDate)}
                  </span>
                </div>
                <p className="pl-14 font-mono text-xs text-muted-foreground">
                  {formatTime(event.startTime)}
                </p>

                {event.endDate && (
                  <>
                    <div className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-sm">
                      <span className="w-12 flex-shrink-0 font-medium text-muted-foreground">
                        End:
                      </span>
                      <span className="break-words font-medium text-foreground">
                        {formatDate(event.endDate)}
                      </span>
                    </div>
                    <p className="pl-14 font-mono text-xs text-muted-foreground">
                      {formatTime(event.endTime)}
                    </p>
                  </>
                )}

                {event.durationDays && event.durationDays > 0 && (
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm">
                    <span className="flex-shrink-0 font-medium text-muted-foreground">
                      Duration:
                    </span>
                    <span className="font-medium text-foreground">
                      {event.durationDays}{" "}
                      {event.durationDays === 1 ? "day" : "days"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recurrence */}
            {event.isRecurring && (
              <div className="rounded-xl border border-border bg-secondary p-4">
                <h3 className={`${MICRO_LABEL} mb-2`}>Recurrence</h3>
                <p className="text-sm font-medium text-foreground">
                  Every{" "}
                  {(event.recurrenceInterval || 1) === 1
                    ? "day"
                    : `${event.recurrenceInterval} days`}
                </p>
                {event.recurrenceInterval && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Repeats every {event.recurrenceInterval}{" "}
                    {event.recurrenceInterval === 1 ? "day" : "days"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <h3 className={`${MICRO_LABEL} mb-3`}>Location</h3>
            <div className="space-y-3">
              <p className="break-words text-base font-semibold text-foreground">
                {event.location?.name || "No location specified"}
              </p>
              {(event.location?.city || event.location?.country) && (
                <p className="break-words text-sm text-muted-foreground">
                  {event.location.city}
                  {event.location.city && event.location.country ? ", " : ""}
                  {event.location.country}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

EventDetails.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    coverImage: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    isRecurring: PropTypes.bool,
    recurrenceInterval: PropTypes.number,
    durationDays: PropTypes.number,
    location: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      city: PropTypes.string,
      country: PropTypes.string,
    }),
  }),
};

export default EventDetails;
