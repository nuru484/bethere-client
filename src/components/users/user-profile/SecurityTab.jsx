// src/components/users/user-profile/SecurityTab.jsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Loader2, Eye, EyeOff, Lock, Save } from "lucide-react";
import CodeForm from "@/components/auth/CodeForm";
import { useChangePassword } from "@/hooks/useUsers";
import { useChangeAdminPassword } from "@/hooks/useAdmins";
import {
  useAuth,
  useTwoFactorChallenge,
  useTwoFactorToggle,
} from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { passwordSchema } from "@/validation/user/profileValidation";

const SecurityTab = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA toggle flow: challenge sends a code, the dialog collects it, then
  // enable/disable proves possession of the channel.
  const [twoFaDialogOpen, setTwoFaDialogOpen] = useState(false);
  const [twoFaChannel, setTwoFaChannel] = useState(null);
  const twoFactorEnabled = !!user?.twoFactorEnabled;

  // Principal split: admins change their password on /admins, attendants
  // on /users. Both endpoints share the same body shape.
  const attendantChangePassword = useChangePassword();
  const adminChangePassword = useChangeAdminPassword();
  const { mutate: changePassword, isPending: isPasswordPending } = isAdmin
    ? adminChangePassword
    : attendantChangePassword;

  const { mutate: sendChallenge, isPending: isChallengePending } =
    useTwoFactorChallenge();
  const { mutate: toggleTwoFactor, isPending: isTogglePending } =
    useTwoFactorToggle();

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (data) => {
    const toastId = toast.loading("Changing password...");

    changePassword(
      {
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      },
      {
        onSuccess: (response) => {
          toast.dismiss(toastId);
          toast.success(response.message || "Password changed successfully!");

          form.reset();
          setIsChangingPassword(false);
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        },
        onError: (err) => {
          console.error("Password change error:", err);
          toast.dismiss(toastId);

          const { message, fieldErrors, hasFieldErrors } =
            extractApiErrorMessage(err);

          if (hasFieldErrors && fieldErrors) {
            Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
              if (field in form.getValues()) {
                form.setError(field, {
                  message: errorMessage,
                });
              }
            });
            toast.error(message);
          } else {
            toast.error(message);
          }
        },
      }
    );
  };

  const handleCancel = () => {
    form.reset();
    setIsChangingPassword(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Password and Security
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your password and authentication settings
        </p>
      </div>

      <Separator className="my-6" />

      {/* Password Information Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Lock className="h-5 w-5" />
            Password Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Keep your account secure with a strong password
          </p>
        </div>

        {!isChangingPassword ? (
          <div className="flex justify-between items-center p-4 border-2 border-border rounded-lg bg-card shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">
                Last changed recently
              </p>
            </div>
            <Button
              onClick={() => setIsChangingPassword(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Change Password
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePasswordChange)}
              className="space-y-6"
            >
              {/* Edit Mode Indicator */}
              <div className="bg-primary/10 dark:bg-primary/20 border-2 border-primary/40 dark:border-primary/50 rounded-lg p-4 animate-in fade-in-50 duration-300">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Password Change Mode Active - Enter your passwords below
                </p>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-5">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Current Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            disabled={isPasswordPending}
                            className="h-11 pr-10 border-2 border-primary/30 bg-primary/5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            disabled={isPasswordPending}
                            className="h-11 pr-10 border-2 border-primary/30 bg-primary/5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium flex items-center gap-2 text-foreground">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            disabled={isPasswordPending}
                            className="h-11 pr-10 border-2 border-primary/30 bg-primary/5 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <Separator className="my-6" />
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  size="lg"
                  className="w-full sm:w-auto font-medium"
                  disabled={isPasswordPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                  disabled={isPasswordPending}
                >
                  {isPasswordPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      <Separator className="my-6" />

      {/* Two-Factor Authentication Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="flex justify-between items-center p-4 border-2 border-border rounded-lg bg-card shadow-sm">
          <div>
            <p className="text-sm font-medium text-foreground">
              Two-factor authentication is{" "}
              <span className="font-semibold">
                {twoFactorEnabled ? "on" : "off"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {twoFactorEnabled
                ? "A verification code is required at every sign in"
                : "Secure your account with a verification code at sign in"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isChallengePending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
      </div>

      <Separator className="my-6" />

      {/* Danger Zone Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="flex justify-between items-center p-4 border-2 border-destructive/30 rounded-lg bg-destructive/5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-destructive">
              Delete Account
            </p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* 2FA Verification Code Dialog */}
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

export default SecurityTab;
