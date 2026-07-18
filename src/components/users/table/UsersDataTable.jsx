// src/components/users/table/UsersDataTable.jsx
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteUser } from "@/hooks/useUsers";
import { DataTable } from "@/components/data-table/DataTable";
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
  // Row selection is controlled here (rows are keyed by index, the tanstack
  // default) so the bulk-delete handler can resolve the selected users.
  const [rowSelection, setRowSelection] = useState({});
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] =
    useState(false);

  const deleteUserMutation = useDeleteUser();

  const columns = useMemo(() => createUserColumns(), []);

  const selectedUsers = useMemo(
    () =>
      Object.keys(rowSelection)
        .map((index) => data[Number(index)])
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

    try {
      const deletePromises = selectedUsers.map((user) =>
        deleteUserMutation.mutateAsync(user.id)
      );
      const response = await Promise.all(deletePromises);
      toast.dismiss(toastId);
      toast.success(
        response.message || `${selectedCount} users deleted successfully`
      );
      setRowSelection({});
      onRefresh?.();
    } catch (error) {
      console.error("Delete error:", error);
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to delete users");
    }
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
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filter criteria"
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
