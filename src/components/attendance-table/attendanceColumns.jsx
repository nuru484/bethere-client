// src/components/attendance-table/attendanceColumns.jsx
//
// One column factory for all three attendance surfaces. `context` selects
// which entity column leads the table and how the shared date/location cells
// render:
//   "user"      -> a user's attendance across events (Event + Location columns)
//   "event"     -> an event's attendance across users (User column)
//   "userEvent" -> one user's attendance within one event (dense, no entity col)
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceActionsDropdown } from "./AttendanceActionsDropdown";

const STATUS_CHIP_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight";

// Status chip helper - shared by the tables and reusable elsewhere.
export const getStatusChipClass = (status) => {
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

// A sortable column header rendered as a ghost button.
const sortableHeader = (label) =>
  function headerCell({ column }) {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={`p-0 h-auto hover:bg-transparent whitespace-nowrap ${HEADER_LABEL_CLASS}`}
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
      </Button>
    );
  };

const plainHeader = (label) =>
  function headerCell() {
    return (
      <span className={`whitespace-nowrap ${HEADER_LABEL_CLASS}`}>{label}</span>
    );
  };

const selectColumn = (dense) => ({
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
  ...(dense ? { size: 40, minSize: 40, maxSize: 40 } : {}),
});

// Entity column: the event a record belongs to (user context).
const eventColumn = () => ({
  accessorKey: "session.event.title",
  header: sortableHeader("Event"),
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
});

// Entity column: the attendant (event context).
const userColumn = () => ({
  accessorKey: "user",
  header: sortableHeader("User"),
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
});

const statusColumn = (dense) => ({
  accessorKey: "status",
  header: plainHeader("Status"),
  cell: ({ row }) => {
    const status = row.getValue("status");
    return (
      <span className={`${getStatusChipClass(status)}${dense ? " whitespace-nowrap" : ""}`}>
        {status}
      </span>
    );
  },
  ...(dense ? { size: 100, minSize: 100 } : {}),
});

// Session date column. `variant` controls the sub-line:
//   "date"      -> responsive date only (user context, not sortable)
//   "datetime"  -> date + check-in-style time (event context)
//   "dayOfWeek" -> date + weekday name, dense (userEvent context)
const sessionDateColumn = (variant) => {
  const base = {
    accessorKey: "session.startDate",
  };

  if (variant === "date") {
    return {
      ...base,
      header: plainHeader("Session Date"),
      cell: ({ row }) => {
        const startDate = row.original.session?.startDate;
        if (!startDate) return <span className="text-xs sm:text-sm">N/A</span>;
        const date = new Date(startDate);
        return (
          <div className="text-xs sm:text-sm">
            <div className="sm:hidden">{format(date, "MMM dd")}</div>
            <div className="hidden sm:block">
              {format(date, "MMM dd, yyyy")}
            </div>
          </div>
        );
      },
    };
  }

  if (variant === "datetime") {
    return {
      ...base,
      header: sortableHeader("Session Date"),
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
    };
  }

  // dayOfWeek (dense)
  return {
    ...base,
    header: sortableHeader("Session Date"),
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
  };
};

const locationColumn = (dense) => {
  if (dense) {
    return {
      accessorKey: "session.event.location",
      header: plainHeader("Location"),
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
    };
  }

  return {
    accessorKey: "session.event.location",
    header: plainHeader("Location"),
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
  };
};

// Shared check-in / check-out time cell rendering (plain render helpers so
// they stay inline in the column def rather than nested components).
const renderDenseTime = (value, emptyLabel) => {
  if (!value) {
    return (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {emptyLabel}
      </span>
    );
  }
  const date = new Date(value);
  return (
    <div className="text-sm whitespace-nowrap">
      <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
      <div className="text-muted-foreground text-xs">
        {format(date, "hh:mm a")}
      </div>
    </div>
  );
};

const renderDefaultTime = (value, emptyLabel) => {
  if (!value) {
    return (
      <span className="text-xs sm:text-sm text-muted-foreground">
        {emptyLabel}
      </span>
    );
  }
  const date = new Date(value);
  return (
    <div className="text-xs sm:text-sm">
      <div>{format(date, "MMM dd, yyyy")}</div>
      <div className="text-muted-foreground">{format(date, "hh:mm a")}</div>
    </div>
  );
};

const checkInColumn = (dense) => ({
  accessorKey: "checkInTime",
  header: sortableHeader("Check In"),
  cell: ({ row }) => {
    const value = row.getValue("checkInTime");
    return dense
      ? renderDenseTime(value, "N/A")
      : renderDefaultTime(value, "N/A");
  },
  ...(dense ? { size: 150, minSize: 150 } : {}),
});

const checkOutColumn = (dense) => ({
  accessorKey: "checkOutTime",
  header: plainHeader("Check Out"),
  cell: ({ row }) => {
    const value = row.getValue("checkOutTime");
    return dense
      ? renderDenseTime(value, "Not checked out")
      : renderDefaultTime(value, "Not checked out");
  },
  ...(dense ? { size: 150, minSize: 150 } : {}),
});

const actionsColumn = (dense) => ({
  id: "actions",
  enableHiding: false,
  header: plainHeader("Actions"),
  cell: ({ row }) => <AttendanceActionsDropdown attendance={row.original} />,
  ...(dense ? { size: 80, minSize: 80 } : {}),
});

// Assemble the ordered column set for a context. `isRecurring` only matters
// for the userEvent context, where a non-recurring event hides the select box.
export const createAttendanceColumns = ({ context, isRecurring = true }) => {
  const dense = context === "userEvent";
  const showSelect = context === "userEvent" ? isRecurring : true;

  const columns = [];

  if (showSelect) columns.push(selectColumn(dense));

  if (context === "user") columns.push(eventColumn());
  if (context === "event") columns.push(userColumn());

  columns.push(statusColumn(dense));

  if (context === "user") {
    columns.push(checkInColumn(false));
    columns.push(checkOutColumn(false));
    columns.push(locationColumn(false));
    columns.push(sessionDateColumn("date"));
  } else if (context === "event") {
    columns.push(sessionDateColumn("datetime"));
    columns.push(checkInColumn(false));
    columns.push(checkOutColumn(false));
  } else {
    // userEvent (dense)
    columns.push(sessionDateColumn("dayOfWeek"));
    columns.push(locationColumn(true));
    columns.push(checkInColumn(true));
    columns.push(checkOutColumn(true));
  }

  columns.push(actionsColumn(dense));

  return columns;
};
