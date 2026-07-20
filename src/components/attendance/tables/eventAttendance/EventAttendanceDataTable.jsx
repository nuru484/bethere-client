// src/components/attendance/tables/eventAttendance/EventAttendanceDataTable.jsx
import { useMemo } from "react";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { createEventAttendanceColumns } from "./columns";
import { EventTableFilters } from "./EventTableFilters";
import PropTypes from "prop-types";

const renderSkeletonCells = () => (
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
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-8 w-8 rounded" />
    </TableCell>
  </>
);

export function EventAttendanceDataTable({
  data,
  loading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  filters,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
}) {
  const columns = useMemo(() => createEventAttendanceColumns(), []);

  const hasActiveFilters =
    filters.search !== undefined ||
    filters.status !== undefined ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

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
      renderFilters={(table) => (
        <EventTableFilters
          table={table}
          filters={filters}
          onFiltersChange={onFiltersChange}
          totalCount={totalCount}
        />
      )}
      renderSkeletonCells={renderSkeletonCells}
      hasActiveFilters={hasActiveFilters}
      emptyState={
        <EmptyState
          eyebrow="Attendance"
          title="No attendance records"
          description="Records will appear here once attendants check in to this event."
        />
      }
      emptyMessage="No records match the current filters - clear the filters to see all records."
    />
  );
}

EventAttendanceDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};
