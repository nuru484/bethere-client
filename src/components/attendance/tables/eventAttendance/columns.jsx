// src/components/attendance/tables/eventAttendance/columns.jsx
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EventAttendanceActionsDropdown } from "./EventAttendanceActionsDropdown";

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

export const createEventAttendanceColumns = () => [
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
    accessorKey: "user",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`p-0 h-auto hover:bg-transparent text-left justify-start ${HEADER_LABEL_CLASS}`}
      >
        User
        <ArrowUpDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profilePicture} alt={user?.firstName} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="max-w-[200px] sm:max-w-[300px]">
            <div className="font-medium truncate text-sm sm:text-base">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              {user?.email}
            </div>
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
    accessorKey: "session.startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`p-0 h-auto hover:bg-transparent ${HEADER_LABEL_CLASS}`}
      >
        Session Date
        <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.5} />
      </Button>
    ),
    cell: ({ row }) => {
      const startDate = row.original.session?.startDate;
      if (!startDate) return <span className="text-xs sm:text-sm">N/A</span>;
      const date = new Date(startDate);
      return (
        <div className="text-xs sm:text-sm">
          <div>{format(date, "MMM dd, yyyy")}</div>
          <div className="text-muted-foreground">{format(date, "hh:mm a")}</div>
        </div>
      );
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
    id: "actions",
    enableHiding: false,
    header: () => <span className={HEADER_LABEL_CLASS}>Actions</span>,
    cell: ({ row }) => (
      <EventAttendanceActionsDropdown attendance={row.original} />
    ),
  },
];
