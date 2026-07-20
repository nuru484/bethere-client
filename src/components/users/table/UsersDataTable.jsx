// src/components/users/table/UsersDataTable.jsx
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteUser } from "@/hooks/useUsers";
import { DataTable } from "@/components/data-table/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { createUserColumns } from "./columns";
import { TableFilters } from "./TableFilters";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import PropTypes from "prop-types";

const renderSkeletonCells = () => (
  <>
    <TableCell>
      <Skeleton className="h-4 w-4" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-10 w-10 rounded-md" />
    </TableCell>
    <TableCell>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full max-w-[300px]" />
        <Skeleton className="h-3 w-24" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <div className="flex items-center space-x-1">
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </TableCell>
  </>
);

export function UsersDataTable({
  data,
  loading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  filters,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onRefresh,
}) {
  // Row selection is controlled here so the bulk-delete handler can resolve the
  // selected users. Rows are keyed by user id, NOT tanstack's default row index,
  // otherwise paging would re-point a stale selection at a different user.
  const [rowSelection, setRowSelection] = useState({});
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] =
    useState(false);

  const deleteUserMutation = useDeleteUser();

  const columns = useMemo(() => createUserColumns(), []);

  const hasActiveFilters = filters.search !== undefined;

  const getRowId = useCallback((user) => String(user.id), []);

  // Never act on a row the admin cannot currently see selected: drop the
  // selection whenever the visible page or the filters change.
  useEffect(() => {
    setRowSelection({});
  }, [page, pageSize, filters]);

  const selectedUsers = useMemo(
    () =>
      Object.keys(rowSelection)
        .map((id) => data.find((user) => String(user.id) === id))
        .filter(Boolean),
    [rowSelection, data]
  );
  const selectedCount = selectedUsers.length;

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      toast.error("Please select users to delete");
      return;
    }
    setDeleteSelectedDialogOpen(true);
  };

  const handleDeleteSelectedUsers = async () => {
    setDeleteSelectedDialogOpen(false);

    const toastId = toast.loading(
      `Deleting ${selectedCount} users..., please wait`
    );

    const results = await Promise.allSettled(
      selectedUsers.map((user) => deleteUserMutation.mutateAsync(user.id))
    );
    toast.dismiss(toastId);

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    if (failed === 0) {
      toast.success(`${succeeded} users deleted successfully`);
    } else if (succeeded === 0) {
      toast.error(`Failed to delete ${failed} users`);
    } else {
      toast.error(
        `Deleted ${succeeded} users, but ${failed} could not be deleted`
      );
    }

    // Clear selection and refresh so the table reflects whatever was removed,
    // even on partial failure.
    setRowSelection({});
    onRefresh?.();
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={getRowId}
        renderFilters={(table) => (
          <TableFilters
            table={table}
            filters={filters}
            onFiltersChange={onFiltersChange}
            totalCount={totalCount}
            onDeleteSelected={handleDeleteSelected}
          />
        )}
        renderSkeletonCells={renderSkeletonCells}
        hasActiveFilters={hasActiveFilters}
        emptyState={
          <EmptyState
            eyebrow="People"
            title="No attendants yet"
            description="Registered attendants will appear here once they are added."
          />
        }
        emptyMessage="No attendants match the current filters - clear the filters to see everyone."
      />

      {/* Delete Selected Users Dialog */}
      <ConfirmationDialog
        open={deleteSelectedDialogOpen}
        onOpenChange={setDeleteSelectedDialogOpen}
        title="Delete Selected Users"
        description={`Are you sure you want to delete ${selectedCount} selected users? This action cannot be undone.`}
        onConfirm={handleDeleteSelectedUsers}
        confirmText="Delete Selected"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  );
}

UsersDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  filters: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
};
