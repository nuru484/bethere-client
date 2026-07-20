// src/components/attendance-table/AttendanceDataTable.jsx
//
// One configurable attendance table wrapping the shared DataTable shell. The
// `context` prop selects the column set, the filter controls, the loading
// skeleton and the empty-state copy for each of the three surfaces:
//   "user"      -> a user's attendance across events
//   "event"     -> an event's attendance across users
//   "userEvent" -> one user's attendance within one event
import { useMemo } from "react";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { createAttendanceColumns } from "./attendanceColumns";
import { AttendanceTableFilters } from "./AttendanceTableFilters";
import PropTypes from "prop-types";

// Per-context static configuration (copy + which filter controls show).
const CONTEXT_CONFIG = {
  user: {
    filters: {
      showSearch: true,
      showEventType: true,
      searchPlaceholder: "Search by event, location, or type...",
    },
    empty: {
      title: "No attendance records",
      description: "This attendant has no check-in history yet.",
    },
  },
  event: {
    filters: {
      showSearch: true,
      searchPlaceholder: "Search name, email or session #",
    },
    empty: {
      title: "No attendance records",
      description:
        "Records will appear here once attendants check in to this event.",
    },
  },
  userEvent: {
    filters: {
      showSessionId: true,
    },
    empty: {
      title: "No attendance records",
    },
  },
};

const TwoLineSkeleton = ({ w1 = "w-24", w2 = "w-16" }) => (
  <TableCell>
    <div className="space-y-1">
      <Skeleton className={`h-4 ${w1}`} />
      <Skeleton className={`h-3 ${w2}`} />
    </div>
  </TableCell>
);

TwoLineSkeleton.propTypes = {
  w1: PropTypes.string,
  w2: PropTypes.string,
};

// Skeleton row whose cell count matches the column set for the context.
const buildSkeletonRenderer = (context, isRecurring) =>
  function renderSkeletonCells() {
    if (context === "user") {
      return (
        <>
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16 rounded-full" />
          </TableCell>
          <TwoLineSkeleton />
          <TwoLineSkeleton />
          <TwoLineSkeleton w1="w-20" />
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </>
      );
    }

    if (context === "event") {
      return (
        <>
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16 rounded-full" />
          </TableCell>
          <TwoLineSkeleton />
          <TwoLineSkeleton />
          <TwoLineSkeleton />
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </>
      );
    }

    // userEvent
    return (
      <>
        {isRecurring && (
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
        )}
        <TableCell>
          <Skeleton className="h-6 w-16 rounded-full" />
        </TableCell>
        <TwoLineSkeleton />
        <TwoLineSkeleton w1="w-32" w2="w-24" />
        <TwoLineSkeleton />
        <TwoLineSkeleton />
        <TableCell>
          <Skeleton className="h-8 w-8 rounded" />
        </TableCell>
      </>
    );
  };

export function AttendanceDataTable({
  context,
  data,
  loading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  filters,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  isRecurring = true,
}) {
  const columns = useMemo(
    () => createAttendanceColumns({ context, isRecurring }),
    [context, isRecurring]
  );

  const renderSkeletonCells = useMemo(
    () => buildSkeletonRenderer(context, isRecurring),
    [context, isRecurring]
  );

  const config = CONTEXT_CONFIG[context];
  const filterConfig = config.filters;

  const hasActiveFilters =
    filters.status !== undefined ||
    filters.search !== undefined ||
    filters.eventType !== undefined ||
    filters.sessionId !== undefined ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  // userEvent for a one-off (non-recurring) event: no filter bar, no pagination.
  const showFilters = context !== "userEvent" || isRecurring;
  const showPagination =
    context !== "userEvent" || (isRecurring && totalCount > pageSize);

  const emptyDescription =
    context === "userEvent"
      ? isRecurring
        ? "This attendant has no session records for this event yet."
        : "This attendant has not attended this event."
      : config.empty.description;

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderFilters={
        showFilters
          ? (table) => (
              <AttendanceTableFilters
                table={table}
                filters={filters}
                onFiltersChange={onFiltersChange}
                totalCount={totalCount}
                {...filterConfig}
              />
            )
          : undefined
      }
      renderSkeletonCells={renderSkeletonCells}
      hasActiveFilters={hasActiveFilters}
      emptyState={
        <EmptyState
          eyebrow="Attendance"
          title={config.empty.title}
          description={emptyDescription}
        />
      }
      emptyMessage="No records match the current filters - clear the filters to see all records."
      showPagination={showPagination}
    />
  );
}

AttendanceDataTable.propTypes = {
  context: PropTypes.oneOf(["user", "event", "userEvent"]).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    eventType: PropTypes.string,
    sessionId: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  isRecurring: PropTypes.bool,
};
