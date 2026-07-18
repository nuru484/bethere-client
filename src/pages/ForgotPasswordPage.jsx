// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
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
import { useRequestPasswordReset } from "@/hooks/usePasswordReset";
import { forgotPasswordSchema } from "@/validation/password-reset-validation";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const ForgotPasswordPage = () => {
  usePageTitle("Forgot Password");
  const { mutate: requestReset, isPending } = useRequestPasswordReset();
  const [submittedEmail, setSubmittedEmail] = useState(null);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data) => {
    requestReset(data, {
      onSuccess: () => setSubmittedEmail(data.email),
      onError: (err) => {
        const { message, fieldErrors, hasFieldErrors } =
          extractApiErrorMessage(err);

        if (hasFieldErrors && fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
            form.setError(field, { message: errorMessage });
          });
        }

        if (!hasFieldErrors || message) {
          toast.error(message || "Something went wrong. Please try again.");
        }
      },
    });
  };

  return (
    <AuthShell>
      {submittedEmail ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <MailCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-3 text-gray-600">
            If an account exists for{" "}
            <span className="font-semibold text-gray-800">
              {submittedEmail}
            </span>
            , we&apos;ve sent a link to reset your password. The link expires in
            15 minutes.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmittedEmail(null)}
            className="mt-6 w-full rounded-xl border-2 py-3.5 h-auto"
          >
            Use a different email
          </Button>
          <BackToLogin />
        </div>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot your password?
            </h1>
            <p className="mt-2 text-gray-600">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        </div>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="w-full pl-12 pr-4 py-3.5 h-auto rounded-xl border-2 border-gray-200 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 bg-white"
                          disabled={isPending}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-destructive text-xs font-medium" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3.5 px-6 h-auto rounded-xl transition-all duration-200 focus:ring-4 focus:ring-emerald-200 focus:outline-none flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span>Sending link...</span>
                ) : (
                  <>
                    <span>Send reset link</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <BackToLogin />
        </>
      )}
    </AuthShell>
  );
};

const BackToLogin = () => (
  <Link
    to="/login"
    className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to login
  </Link>
);

// Centered branded shell shared by the password-reset screens.
export const AuthShell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 font-sans antialiased p-6">
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
          <img
            src="/assets/logo.png"
            alt="BeThere Logo"
            className="h-9 w-9 object-contain"
          />
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
          BeThere
        </span>
      </div>
      <div className="bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-xl p-8">
        {children}
      </div>
    </div>
  </div>
);

AuthShell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ForgotPasswordPage;
