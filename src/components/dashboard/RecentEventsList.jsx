// src/components/dashboard/RecentEventsList.jsx
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RecentEventsList = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No recent events available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Events</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {events.map((event, index) => (
            <div
              key={event.id || index}
              className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <h3 className="font-semibold text-sm mb-1">{event.title}</h3>

              {event.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {event.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                <span>
                  {event.startTime} - {event.endTime}
                </span>

                {event.location && (
                  <span className="truncate normal-case font-normal font-body text-xs">
                    {event.location.name}
                    {event.location.city && `, ${event.location.city}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

RecentEventsList.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      location: PropTypes.shape({
        name: PropTypes.string,
        city: PropTypes.string,
      }),
    })
  ),
};

export default RecentEventsList;
