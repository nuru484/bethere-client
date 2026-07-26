// src/pages/dashboard/users/AddUserPage.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import AddUserForm from "@/components/users/AddUserForm";
import { Button } from "@/components/ui/button";
import { useAddUser } from "@/hooks/useUsers";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { addUserSchema } from "@/validation/user/addUserValidation";

export default function AddUserPage() {
  const navigate = useNavigate();
  const { mutateAsync: createUser, isPending } = useAddUser();

  const defaultValues = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }),
    []
  );

  const form = useForm({
    resolver: zodResolver(addUserSchema),
    defaultValues,
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
      };
      if (values.phone) payload.phone = values.phone;

      const response = await createUser(payload);
      toast.success(response.message || "User created successfully");
      navigate(`/dashboard/users/${response.data.id}/profile`);
    } catch (error) {
      console.error("User form submission error:", error);

      const { message, fieldErrors, hasFieldErrors } =
        extractApiErrorMessage(error);

      if (hasFieldErrors && fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
          form.setError(field, {
            message: errorMessage,
          });
        });
        toast.error(message);
      } else {
        toast.error(message);
      }
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard/users");
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header: mono eyebrow + display title */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            New attendant
          </p>
          <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
            Create Attendant
          </h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
            Fill in details to add a new attendant to the system
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={handleGoBack}
        >
          Back
        </Button>
      </div>

      <AddUserForm form={form} onSubmit={onSubmit} isLoading={isPending} />
    </div>
  );
}
