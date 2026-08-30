// src/pages/dashboard/admins/AddAdminPage.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import AddAdminForm from "@/components/admins/AddAdminForm";
import BackButton from "@/components/ui/BackButton";
import { useAddAdmin } from "@/hooks/useAdmins";
import { usePageTitle } from "@/hooks/usePageTitle";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { addAdminSchema } from "@/validation/user/addUserValidation";

export default function AddAdminPage() {
  usePageTitle("Add Admin");
  const navigate = useNavigate();
  const { mutateAsync: createAdmin, isPending } = useAddAdmin();

  const defaultValues = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    }),
    []
  );

  const form = useForm({
    resolver: zodResolver(addAdminSchema),
    defaultValues,
  });

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
      navigate("/dashboard/admins");
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
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header: mono eyebrow, back control beside the display title */}
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            New admin
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2 sm:gap-3">
            <BackButton to="/dashboard/admins" label="Back to admins" />
            <h1 className="min-w-0 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Create admin
            </h1>
          </div>
          <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
            Create a new administrator account with dashboard access
          </p>
        </div>
      </div>

      <AddAdminForm form={form} onSubmit={onSubmit} isLoading={isPending} />
    </div>
  );
}
