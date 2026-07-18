// src/pages/dashboard/admins/Admins.jsx
//
// Admin staff management (principal split): list + create + delete over
// the /admins endpoints, reusing the shared DataTable. Only reachable by
// ADMIN users (route-guarded).
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format } from "date-fns";
import PropTypes from "prop-types";
import {
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import { TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetAllAdmins,
  useAddAdmin,
  useDeleteAdmin,
} from "@/hooks/useAdmins";
import { usePageTitle } from "@/hooks/usePageTitle";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { addUserSchema } from "@/validation/user/addUserValidation";

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
      <Skeleton className="h-8 w-8 rounded" />
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
        <Badge className="text-xs gap-1" variant="default">
          <ShieldCheck className="h-3 w-3" />
          On
        </Badge>
      ) : (
        <Badge className="text-xs gap-1" variant="outline">
          <ShieldOff className="h-3 w-3" />
          Off
        </Badge>
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
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          disabled={isSelf}
          title={isSelf ? "You cannot delete your own account" : "Delete admin"}
          onClick={() => onDelete(row.original)}
        >
          <span className="sr-only">Delete admin</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
  },
];

const AddAdminDialog = ({ open, onOpenChange }) => {
  const { mutateAsync: createAdmin, isPending } = useAddAdmin();

  const form = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const handleClose = (nextOpen) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      };
      if (values.phone) payload.phone = values.phone;

      const response = await createAdmin(payload);
      toast.success(response.message || "Admin created successfully");
      handleClose(false);
    } catch (error) {
      const { message, fieldErrors, hasFieldErrors } =
        extractApiErrorMessage(error);

      if (hasFieldErrors && fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
          form.setError(field, { message: errorMessage });
        });
      }
      toast.error(message || "Failed to create admin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Admin</DialogTitle>
          <DialogDescription>
            Create a new administrator account. They can sign in with the
            email and password below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone Number{" "}
                    <span className="text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+233 54 648 8115"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a strong password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AddAdminDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
};

const AdminsPage = () => {
  usePageTitle("Admins");
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const {
    data: adminsData,
    isLoading,
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

  if (isLoading && !adminsData) {
    return <DataTableSkeleton />;
  }

  if (isError) {
    const { message } = extractApiErrorMessage(error);
    return (
      <div className="flex items-center justify-center min-h-96 px-4">
        <ErrorMessage error={message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                Admins Management
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug">
                Manage administrator accounts ({totalAdmins} total)
              </p>
            </div>
          </div>

          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-foreground text-background hover:bg-foreground/90 text-xs sm:text-sm font-semibold flex-shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Add Admin
          </Button>
        </div>

        {/* Admins Data Table */}
        <div className="overflow-hidden">
          <DataTable
            columns={columns}
            data={admins}
            loading={isLoading}
            totalCount={totalAdmins}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setPage(1);
            }}
            renderSkeletonCells={renderSkeletonCells}
            emptyTitle="No admins found"
            emptyDescription="Create an administrator account to get started"
          />
        </div>
      </div>

      {/* Create Admin Dialog */}
      <AddAdminDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

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
  );
};

export default AdminsPage;
