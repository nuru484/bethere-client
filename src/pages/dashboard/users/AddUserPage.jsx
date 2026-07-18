// src/pages/dashboard/users/AddUserPage.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Plus } from "lucide-react";
import AddUserForm from "@/components/users/AddUserForm";
import { Button } from "@/components/ui/button";
import { useAddUser } from "@/hooks/useUsers";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { addUserSchema } from "@/validation/user/addUserValidation";

export default function AddUserPage() {
  const navigate = useNavigate();
  const { mutateAsync: createUser, isLoading } = useAddUser();

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
    resolver: zodResolver(addUserSchema),
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
      {/* Header Section */}
      <div className="space-y-3 sm:space-y-0">
        {/* Back Button - Mobile Only */}
        <div className="flex justify-end sm:hidden">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 h-8"
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
        </div>

        {/* Header with Back Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                Create Attendant
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug">
                Fill in details to add a new attendant to the system
              </p>
            </div>
          </div>

          {/* Back Button - Desktop Only */}
          <Button
            variant="outline"
            className="hidden sm:flex border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>

      <AddUserForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
    </div>
  );
}
