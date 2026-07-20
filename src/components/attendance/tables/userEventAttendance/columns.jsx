// src/components/attendance/tables/userEventAttendance/columns.jsx
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserEventAttendanceActionsDropdown } from "./UserEventAttendanceActionsDropdown";

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

export const createUserEventAttendanceColumns = (isRecurring = true) => {
  const columns = [
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
      size: 40,
      minSize: 40,
      maxSize: 40,
    },
    {
      accessorKey: "status",
      header: () => <span className={HEADER_LABEL_CLASS}>Status</span>,
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <span className={`${getStatusChipClass(status)} whitespace-nowrap`}>
            {status}
          </span>
        );
      },
      size: 100,
      minSize: 100,
    },
    {
      accessorKey: "session.startDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={`p-0 h-auto hover:bg-transparent whitespace-nowrap ${HEADER_LABEL_CLASS}`}
        >
          Session Date
          <ArrowUpDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
        </Button>
      ),
      cell: ({ row }) => {
        const startDate = row.original.session?.startDate;
        if (!startDate) return <span className="text-sm">N/A</span>;
        const date = new Date(startDate);
        return (
          <div className="text-sm whitespace-nowrap">
            <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground text-xs">
              {format(date, "EEEE")}
            </div>
          </div>
        );
      },
      size: 150,
      minSize: 150,
    },
    {
      accessorKey: "session.event.location",
      header: () => (
        <span className={`whitespace-nowrap ${HEADER_LABEL_CLASS}`}>
          Location
        </span>
      ),
      cell: ({ row }) => {
        const location = row.original.session?.event?.location;
        if (!location) return <span className="text-sm">N/A</span>;
        return (
          <div className="flex items-start gap-2 text-sm min-w-[200px]">
            <div>
              <div className="font-medium whitespace-nowrap">
                {location.name}
              </div>
              {location.city && (
                <div className="text-muted-foreground text-xs whitespace-nowrap">
                  {location.city}
                  {location.country && `, ${location.country}`}
                </div>
              )}
            </div>
          </div>
        );
      },
      size: 220,
      minSize: 200,
    },
    {
      accessorKey: "checkInTime",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={`p-0 h-auto hover:bg-transparent whitespace-nowrap ${HEADER_LABEL_CLASS}`}
        >
          Check In
          <ArrowUpDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
        </Button>
      ),
      cell: ({ row }) => {
        const checkInTime = row.getValue("checkInTime");
        if (!checkInTime) {
          return <span className="text-sm text-muted-foreground">N/A</span>;
        }
        const date = new Date(checkInTime);
        return (
          <div className="text-sm whitespace-nowrap">
            <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground text-xs">
              {format(date, "hh:mm a")}
            </div>
          </div>
        );
      },
      size: 150,
      minSize: 150,
    },
    {
      accessorKey: "checkOutTime",
      header: () => (
        <span className={`whitespace-nowrap ${HEADER_LABEL_CLASS}`}>
          Check Out
        </span>
      ),
      cell: ({ row }) => {
        const checkOutTime = row.getValue("checkOutTime");
        if (!checkOutTime) {
          return (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Not checked out
            </span>
          );
        }
        const date = new Date(checkOutTime);
        return (
          <div className="text-sm whitespace-nowrap">
            <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground text-xs">
              {format(date, "hh:mm a")}
            </div>
          </div>
        );
      },
      size: 150,
      minSize: 150,
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => (
        <span className={`whitespace-nowrap ${HEADER_LABEL_CLASS}`}>
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <UserEventAttendanceActionsDropdown attendance={row.original} />
      ),
      size: 80,
      minSize: 80,
    },
  ];

  // For non-recurring events, hide the select column
  return isRecurring ? columns : columns.filter((col) => col.id !== "select");
};
