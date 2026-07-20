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
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#dcf5e9]">
            <MailCheck className="h-8 w-8 text-[#1a7f53]" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
            Check your email
          </h1>
          <p className="mt-3 text-muted-foreground">
            If an account exists for{" "}
            <span className="font-semibold text-foreground">
              {submittedEmail}
            </span>
            , we&apos;ve sent a link to reset your password. The link expires in
            15 minutes.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmittedEmail(null)}
            className="mt-6 w-full h-11"
          >
            Use a different email
          </Button>
          <BackToLogin />
        </div>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
              Forgot your password?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail
                            className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors"
                            strokeWidth={1.5}
                          />
                        </div>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="w-full pl-11 pr-4 h-11"
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
                className="w-full h-11"
              >
                {isPending ? (
                  <span>Sending link...</span>
                ) : (
                  <>
                    <span>Send reset link</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
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
    className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
  >
    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
    Back to login
  </Link>
);

// Centered branded shell shared by the password-reset screens.
export const AuthShell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-background antialiased p-6">
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="w-10 h-10 bg-[#2b2b2b] rounded-xl flex items-center justify-center">
          <span className="font-mono text-xs font-bold text-[#fafafa]">B/</span>
        </div>
        <span className="font-display text-2xl font-normal text-foreground tracking-[-0.02em]">
          BeThere
        </span>
      </div>
      <div className="bg-card border border-border rounded-2xl p-8">
        {children}
      </div>
    </div>
  </div>
);

AuthShell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ForgotPasswordPage;
