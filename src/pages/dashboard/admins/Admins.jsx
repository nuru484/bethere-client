// src/pages/dashboard/admins/Admins.jsx
//
// Admin staff management (principal split): list + create + delete over
// the /admins endpoints, reusing the shared DataTable. Only reachable by
// ADMIN users (route-guarded).
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import EmptyState from "@/components/ui/EmptyState";
import AsyncBoundary from "@/components/ui/AsyncBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllAdmins, useDeleteAdmin } from "@/hooks/useAdmins";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const renderSkeletonCells = () => (
  <>
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
      <Skeleton className="h-6 w-16 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-8 w-16 rounded" />
    </TableCell>
  </>
);

const createAdminColumns = ({ currentUserId, onDelete }) => [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <div className="max-w-[200px] sm:max-w-[300px]">
        <div className="font-medium truncate text-sm sm:text-base">
          {row.original.firstName} {row.original.lastName}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
          {row.original.email}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm">{row.original.phone || "N/A"}</span>
    ),
  },
  {
    accessorKey: "twoFactorEnabled",
    header: "2FA",
    cell: ({ row }) =>
      row.original.twoFactorEnabled ? (
        <Badge variant="default">On</Badge>
      ) : (
        <Badge variant="outline">Off</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
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
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const isSelf = Number(row.original.id) === Number(currentUserId);
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isSelf}
          title={isSelf ? "You cannot delete your own account" : "Delete admin"}
          onClick={() => onDelete(row.original)}
        >
          Delete
        </Button>
      );
    },
  },
];

const AdminsPage = () => {
  usePageTitle("Admins");
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Page and page size live in the URL so refresh/back/share keep the view.
  const { page, pageSize, setPage, setPageSize } = usePaginatedListState();
  const [adminToDelete, setAdminToDelete] = useState(null);

  const {
    data: adminsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllAdmins({ page, limit: pageSize });

  const deleteAdminMutation = useDeleteAdmin();

  const admins = adminsData?.data || [];
  const totalAdmins = adminsData?.meta?.total || 0;

  const columns = useMemo(
    () =>
      createAdminColumns({
        currentUserId: currentUser?.id,
        onDelete: setAdminToDelete,
      }),
    [currentUser?.id]
  );

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    const toastId = toast.loading("Deleting admin...");

    try {
      const response = await deleteAdminMutation.mutateAsync(adminToDelete.id);
      toast.dismiss(toastId);
      toast.success(response.message || "Admin deleted successfully");
    } catch (err) {
      toast.dismiss(toastId);
      const { message } = extractApiErrorMessage(err);
      toast.error(message || "Failed to delete admin");
    } finally {
      setAdminToDelete(null);
    }
  };

  return (
    <AsyncBoundary
      isLoading={isLoading && !adminsData}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<DataTableSkeleton />}
    >
      <div className="min-h-screen">
      <div className="space-y-4 sm:space-y-6">
        {/* Header: mono eyebrow + display title */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              People
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Admins
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Staff accounts with dashboard access
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/dashboard/admins/add")}
            className="flex-shrink-0"
          >
            Add admin
          </Button>
        </div>

        {/* Admins Data Table */}
        <div className="overflow-hidden">
          <DataTable
            columns={columns}
            data={admins}
            loading={isLoading}
            fetching={isFetching && !isLoading}
            totalCount={totalAdmins}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            renderFilters={() => (
              <div className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {totalAdmins} total
              </div>
            )}
            renderSkeletonCells={renderSkeletonCells}
            emptyState={
              <EmptyState
                eyebrow="People"
                title="No admins yet"
                description="Use the add button above to create the first administrator account."
              />
            }
            emptyMessage="No admins to show on this page."
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!adminToDelete}
        onOpenChange={(open) => {
          if (!open) setAdminToDelete(null);
        }}
        title="Delete Admin"
        description={`Are you sure you want to delete "${
          adminToDelete?.firstName || ""
        } ${
          adminToDelete?.lastName || ""
        }"? Their sessions will be revoked and this action cannot be undone.`}
        onConfirm={handleDeleteAdmin}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
      </div>
    </AsyncBoundary>
  );
};

export default AdminsPage;
