// src/components/attendance/tables/userAttendance/AttendanceDataTable.jsx
import { useMemo } from "react";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { createAttendanceColumns } from "./columns";
import { TableFilters } from "./TableFilters";
import PropTypes from "prop-types";

const renderSkeletonCells = () => (
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
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-8 w-8 rounded" />
    </TableCell>
  </>
);

export function AttendanceDataTable({
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
  const columns = useMemo(() => createAttendanceColumns(), []);

  const hasActiveFilters =
    filters.search !== undefined ||
    filters.status !== undefined ||
    filters.eventType !== undefined ||
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
        <TableFilters
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
          description="This attendant has no check-in history yet."
        />
      }
      emptyMessage="No records match the current filters - clear the filters to see all records."
    />
  );
}

AttendanceDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    eventType: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
};
