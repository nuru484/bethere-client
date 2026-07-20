// src/components/attendance-table/AttendanceActionsDropdown.jsx
//
// Single row-actions menu shared by every attendance table. "View Details"
// opens the user's attendance for that event (the user+event view), deriving
// both ids from the record itself so it works from the user, event and
// user+event tables alike.
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PropTypes from "prop-types";

export function AttendanceActionsDropdown({ attendance }) {
  const navigate = useNavigate();

  const userId = attendance.user?.id ?? attendance.userId;
  const eventId =
    attendance.session?.event?.id ?? attendance.session?.eventId;

  const canViewDetails = userId != null && eventId != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 hover:cursor-pointer">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* View Details -> the user's attendance for this event */}
        <DropdownMenuItem
          disabled={!canViewDetails}
          onClick={() =>
            navigate(`/dashboard/attendance/user/${userId}/event/${eventId}`)
          }
          className="hover:cursor-pointer"
        >
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

AttendanceActionsDropdown.propTypes = {
  attendance: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]).isRequired,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    user: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    session: PropTypes.shape({
      eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      event: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
      }),
    }),
  }).isRequired,
};
