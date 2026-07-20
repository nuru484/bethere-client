// src/components/users/user-profile/SecurityTab.jsx
//
// Security settings for the signed-in principal: password change and email
// 2FA, each on its own paper sheet. The profile `kind` routes the password
// change to /users or /admins - the two principals have mirrored endpoints.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CodeForm from "@/components/auth/CodeForm";
import { microLabel, sheet } from "./profile-styles";
import { useChangeProfilePassword } from "@/hooks/useProfile";
import {
  useAuth,
  useTwoFactorChallenge,
  useTwoFactorToggle,
} from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { buildPasswordSchema } from "@/validation/user/profileValidation";

const PASSWORD_FIELDS = [
  { name: "currentPassword", label: "Current password" },
  { name: "newPassword", label: "New password" },
  { name: "confirmPassword", label: "Confirm new password" },
];

const SecurityTab = ({ kind }) => {
  const { user } = useAuth();

  // Passwordless (OTP-only) accounts have no current password to confirm.
  // The backend exposes `hasPassword`; treat a missing value as "has one"
  // so the stricter path is the default. The backend enforces the rule too.
  const hasPassword = user?.hasPassword !== false;
  const passwordFields = hasPassword
    ? PASSWORD_FIELDS
    : PASSWORD_FIELDS.filter((field) => field.name !== "currentPassword");

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});

  // 2FA toggle flow: challenge sends a code, the dialog collects it, then
  // enable/disable proves possession of the channel.
  const [twoFaDialogOpen, setTwoFaDialogOpen] = useState(false);
  const [twoFaChannel, setTwoFaChannel] = useState(null);
  const twoFactorEnabled = !!user?.twoFactorEnabled;

  const { mutate: changePassword, isPending: isPasswordPending } =
    useChangeProfilePassword(kind);
  const { mutate: sendChallenge, isPending: isChallengePending } =
    useTwoFactorChallenge();
  const { mutate: toggleTwoFactor, isPending: isTogglePending } =
    useTwoFactorToggle();

  const form = useForm({
    resolver: zodResolver(buildPasswordSchema(hasPassword)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const toggleVisibility = (name) =>
    setVisibleFields((prev) => ({ ...prev, [name]: !prev[name] }));

  const closePasswordForm = () => {
    form.reset();
    setIsChangingPassword(false);
    setVisibleFields({});
  };

  const handlePasswordChange = (data) => {
    const toastId = toast.loading("Changing password...");

    const payload = { newPassword: data.newPassword };
    // Only send currentPassword for accounts that actually have one.
    if (hasPassword) {
      payload.currentPassword = data.currentPassword;
    }

    changePassword(payload, {
        onSuccess: (response) => {
          toast.dismiss(toastId);
          toast.success(response.message || "Password changed successfully!");
          closePasswordForm();
        },
        onError: (err) => {
          console.error("Password change error:", err);
          toast.dismiss(toastId);

          const { message, fieldErrors, hasFieldErrors } =
            extractApiErrorMessage(err);

          if (hasFieldErrors && fieldErrors) {
            Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
              if (field in form.getValues()) {
                form.setError(field, { message: errorMessage });
              }
            });
          }
          toast.error(message);
        },
      }
    );
  };

  const handleTwoFactorSwitch = () => {
    // Step 1: send the verification code, then collect it in the dialog.
    sendChallenge(undefined, {
      onSuccess: (response) => {
        setTwoFaChannel(response.data?.channel ?? null);
        setTwoFaDialogOpen(true);
        toast.success(response.message || "We sent you a verification code.");
      },
      onError: (err) => {
        const { message } = extractApiErrorMessage(err);
        toast.error(message || "Could not send a verification code.");
      },
    });
  };

  const handleTwoFactorCode = (code) => {
    // Step 2: prove possession; the response carries the updated user,
    // which useTwoFactorToggle merges into the persisted user.
    toggleTwoFactor(
      { enable: !twoFactorEnabled, code },
      {
        onSuccess: (response) => {
          setTwoFaDialogOpen(false);
          toast.success(
            response.message ||
              `Two-factor authentication is now ${
                twoFactorEnabled ? "off" : "on"
              }.`
          );
        },
        onError: (err) => {
          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Invalid code. Please try again.");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Password sheet */}
      <section className={sheet}>
        <p className={microLabel}>Password</p>

        {!isChangingPassword ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Keep your account secure with a strong, unique password.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setIsChangingPassword(true)}
            >
              Change password
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePasswordChange)}
              noValidate
              className="mt-4 space-y-6"
            >
              <div className="grid grid-cols-1 gap-5">
                {passwordFields.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={microLabel}>{label}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={visibleFields[name] ? "text" : "password"}
                              placeholder={label}
                              disabled={isPasswordPending}
                              className="h-11 bg-background pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => toggleVisibility(name)}
                              aria-label={
                                visibleFields[name]
                                  ? `Hide ${label.toLowerCase()}`
                                  : `Show ${label.toLowerCase()}`
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {visibleFields[name] ? (
                                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                              ) : (
                                <Eye className="h-4 w-4" strokeWidth={1.5} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePasswordForm}
                  disabled={isPasswordPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPasswordPending}>
                  {isPasswordPending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={1.5}
                      />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </section>

      {/* Two-factor authentication sheet */}
      <section className={sheet}>
        <p className={microLabel}>Two-factor authentication</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              Two-factor authentication is{" "}
              <span className="font-semibold">
                {twoFactorEnabled ? "on" : "off"}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {twoFactorEnabled
                ? "A verification code is required at every sign in."
                : "Secure your account with a verification code at sign in."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isChallengePending && (
              <Loader2
                className="h-4 w-4 animate-spin text-muted-foreground"
                strokeWidth={1.5}
              />
            )}
            <Switch
              checked={twoFactorEnabled}
              disabled={isChallengePending || isTogglePending}
              onCheckedChange={handleTwoFactorSwitch}
              aria-label="Toggle two-factor authentication"
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </section>

      {/* 2FA verification code dialog */}
      <Dialog open={twoFaDialogOpen} onOpenChange={setTwoFaDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[440px]">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {twoFactorEnabled
                ? "Turn off two-factor authentication"
                : "Turn on two-factor authentication"}
            </DialogTitle>
            <DialogDescription>
              Enter the verification code we sent you to confirm this change.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <CodeForm
              title={
                twoFactorEnabled
                  ? "Confirm turning 2FA off"
                  : "Confirm turning 2FA on"
              }
              channel={twoFaChannel}
              onSubmit={handleTwoFactorCode}
              isLoading={isTogglePending}
              submitLabel={twoFactorEnabled ? "Turn Off 2FA" : "Turn On 2FA"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

SecurityTab.propTypes = {
  kind: PropTypes.oneOf(["user", "admin"]).isRequired,
};

export default SecurityTab;
