// src/components/attendance/tables/userEventAttendance/UserEventAttendanceDataTable.jsx
import { useMemo } from "react";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { createUserEventAttendanceColumns } from "./columns";
import { UserEventTableFilters } from "./UserEventTableFilters";
import PropTypes from "prop-types";

const createRenderSkeletonCells = (isRecurring) =>
  function renderSkeletonCells() {
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
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
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
  };

export function UserEventAttendanceDataTable({
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
    () => createUserEventAttendanceColumns(isRecurring),
    [isRecurring]
  );

  const renderSkeletonCells = useMemo(
    () => createRenderSkeletonCells(isRecurring),
    [isRecurring]
  );

  const hasActiveFilters =
    filters.status !== undefined ||
    filters.sessionId !== undefined ||
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
      renderFilters={
        isRecurring
          ? (table) => (
              <UserEventTableFilters
                table={table}
                filters={filters}
                onFiltersChange={onFiltersChange}
                totalCount={totalCount}
              />
            )
          : undefined
      }
      renderSkeletonCells={renderSkeletonCells}
      hasActiveFilters={hasActiveFilters}
      emptyState={
        <EmptyState
          eyebrow="Attendance"
          title="No attendance records"
          description={
            isRecurring
              ? "This attendant has no session records for this event yet."
              : "This attendant has not attended this event."
          }
        />
      }
      emptyMessage="No records match the current filters - clear the filters to see all records."
      showPagination={isRecurring && totalCount > pageSize}
    />
  );
}

UserEventAttendanceDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  filters: PropTypes.shape({
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    sessionId: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  isRecurring: PropTypes.bool,
};
