// src/components/attendance/tables/userAttendance/columns.jsx
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AttendanceActionsDropdown } from "../../tables/userAttendance/AttendanceActionsDropdown";

const STATUS_CHIP_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight";

const getStatusChipClass = (status) => {
  switch (status) {
    case "PRESENT":
      return `${STATUS_CHIP_BASE} bg-[#dcf5e9] text-[#1a7f53]`;
    case "LATE":
      return `${STATUS_CHIP_BASE} bg-amber-100 text-amber-800`;
    case "ABSENT":
      return `${STATUS_CHIP_BASE} bg-red-100 text-red-700`;
    default:
      return `${STATUS_CHIP_BASE} bg-muted text-muted-foreground`;
  }
};

const HEADER_LABEL_CLASS =
  "font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground";

export const createAttendanceColumns = () => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "session.event.title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`p-0 h-auto hover:bg-transparent text-left justify-start ${HEADER_LABEL_CLASS}`}
      >
        Event
        <ArrowUpDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
      </Button>
    ),
    cell: ({ row }) => {
      const event = row.original.session?.event;
      return (
        <div className="max-w-[200px] sm:max-w-[300px]">
          <div className="font-medium truncate text-sm sm:text-base">
            {event?.title || "N/A"}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
            {event?.type || "N/A"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <span className={HEADER_LABEL_CLASS}>Status</span>,
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <span className={getStatusChipClass(status)}>{status}</span>;
    },
  },
  {
    accessorKey: "checkInTime",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`p-0 h-auto hover:bg-transparent ${HEADER_LABEL_CLASS}`}
      >
        Check In
        <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.5} />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("checkInTime"));
      return (
        <div className="text-xs sm:text-sm">
          <div>{format(date, "MMM dd, yyyy")}</div>
          <div className="text-muted-foreground">{format(date, "hh:mm a")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "checkOutTime",
    header: () => <span className={HEADER_LABEL_CLASS}>Check Out</span>,
    cell: ({ row }) => {
      const checkOutTime = row.getValue("checkOutTime");
      if (!checkOutTime) {
        return (
          <span className="text-xs sm:text-sm text-muted-foreground">
            Not checked out
          </span>
        );
      }
      const date = new Date(checkOutTime);
      return (
        <div className="text-xs sm:text-sm">
          <div>{format(date, "MMM dd, yyyy")}</div>
          <div className="text-muted-foreground">{format(date, "hh:mm a")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "session.event.location",
    header: () => <span className={HEADER_LABEL_CLASS}>Location</span>,
    cell: ({ row }) => {
      const location = row.original.session?.event?.location;
      return (
        <div className="max-w-[150px]">
          <div className="text-xs sm:text-sm">
            <span className="block truncate">{location?.name || "N/A"}</span>
          </div>
          {location?.city && (
            <div className="text-xs text-muted-foreground truncate">
              {location.city}
              {location.country && `, ${location.country}`}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "session.startDate",
    header: () => <span className={HEADER_LABEL_CLASS}>Session Date</span>,
    cell: ({ row }) => {
      const startDate = row.original.session?.startDate;
      if (!startDate) return <span className="text-xs sm:text-sm">N/A</span>;
      const date = new Date(startDate);
      return (
        <div className="text-xs sm:text-sm">
          <div className="sm:hidden">{format(date, "MMM dd")}</div>
          <div className="hidden sm:block">{format(date, "MMM dd, yyyy")}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className={HEADER_LABEL_CLASS}>Actions</span>,
    cell: ({ row }) => <AttendanceActionsDropdown attendance={row.original} />,
  },
];
