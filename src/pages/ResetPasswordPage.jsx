// src/pages/ResetPasswordPage.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useVerifyResetToken,
  useResetPassword,
} from "@/hooks/usePasswordReset";
import { resetPasswordSchema } from "@/validation/password-reset-validation";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { AuthShell } from "./ForgotPasswordPage";

const PasswordField = ({ control, name, label, placeholder, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="block font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock
                  className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors"
                  strokeWidth={1.5}
                />
              </div>
              <Input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                autoComplete="new-password"
                className="w-full pl-11 pr-11 h-11"
                disabled={disabled}
                {...field}
              />
              <button
                type="button"
                onClick={() => setShow((p) => !p)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                disabled={disabled}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <EyeOff
                    className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    strokeWidth={1.5}
                  />
                ) : (
                  <Eye
                    className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    strokeWidth={1.5}
                  />
                )}
              </button>
            </div>
          </FormControl>
          <FormMessage className="text-destructive text-xs font-medium" />
        </FormItem>
      )}
    />
  );
};

const ResetPasswordPage = () => {
  usePageTitle("Reset Password");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    data: verifyData,
    isLoading: isVerifying,
    isError: isInvalidToken,
  } = useVerifyResetToken(token);
  const { mutate: resetPassword, isPending } = useResetPassword();

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data) => {
    resetPassword(
      { token, ...data },
      {
        onSuccess: (response) => {
          toast.success(
            response?.message || "Password reset successful. Please log in."
          );
          navigate("/login", { replace: true });
        },
        onError: (err) => {
          const { message, fieldErrors, hasFieldErrors } =
            extractApiErrorMessage(err);

          if (hasFieldErrors && fieldErrors) {
            Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
              form.setError(field, { message: errorMessage });
            });
          }

          if (!hasFieldErrors || message) {
            toast.error(message || "Could not reset password. Try again.");
          }
        },
      }
    );
  };

  // No token in the URL, or the server rejected it as invalid/expired/used.
  if (!token || isInvalidToken) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
            Invalid or expired link
          </h1>
          <p className="mt-3 text-muted-foreground">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Button asChild className="mt-6 w-full h-11">
            <Link to="/forgot-password">
              Request a new link
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  // Verifying the token before showing the form.
  if (isVerifying) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2
            className="h-10 w-10 animate-spin text-foreground"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-muted-foreground">
            Verifying your reset link...
          </p>
        </div>
      </AuthShell>
    );
  }

  const firstName = verifyData?.data?.firstName;

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
          {firstName ? `Hi ${firstName}, set a new password` : "Set a new password"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <PasswordField
            control={form.control}
            name="newPassword"
            label="New Password"
            placeholder="Enter new password"
            disabled={isPending}
          />
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter new password"
            disabled={isPending}
          />

          <Button type="submit" disabled={isPending} className="w-full h-11">
            {isPending ? (
              <span>Resetting...</span>
            ) : (
              <>
                <span>Reset password</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </>
            )}
          </Button>
        </form>
      </Form>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to login
      </Link>
    </AuthShell>
  );
};

PasswordField.propTypes = {
  control: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ResetPasswordPage;
