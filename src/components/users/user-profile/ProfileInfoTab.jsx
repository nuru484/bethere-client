// src/components/users/user-profile/ProfileInfoTab.jsx
//
// Paper-and-ink profile sheet: mono micro-labels over plain fields, a simple
// ring-bordered avatar, and an inline edit mode. Data access is role-aware
// via the profile `kind` ("user" | "admin"), so an admin editing their own
// profile hits /admins instead of /users. The avatar upload/viewer half
// lives in ProfileAvatarSection.jsx; this file keeps the details form.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";
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
import { microLabel, sheet } from "./profile-styles";
import { useUpdateProfile, useUpdateProfilePicture } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { profileFormSchema } from "@/validation/user/profileValidation";
import ProfileAvatarSection from "./ProfileAvatarSection";

const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
};

const ProfileInfoTab = ({ user, kind }) => {
  const [isEditing, setIsEditing] = useState(false);

  const { user: currentUser, login: logUserIn } = useAuth();
  const isViewingOwnProfile = currentUser?.id === user?.id;

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile(kind);
  // The picture mutation lives here (not in the avatar section) because its
  // pending state also has to disable the details form below.
  const { mutateAsync: updateProfilePicture, isPending: isUpdatingPicture } =
    useUpdateProfilePicture(kind);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    },
  });

  const handleCancelProfileEdit = () => {
    form.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
  };

  const handleSubmitProfile = async (data) => {
    const toastId = toast.loading("Updating profile...");
    try {
      const response = await updateProfile({
        profileId: user.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
        },
      });
      toast.dismiss(toastId);
      toast.success(response.message || "Profile updated successfully!");
      if (isViewingOwnProfile && response.data) {
        logUserIn(response.data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
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
    }
  };

  const isBusy = isUpdatingProfile || isUpdatingPicture;

  // Read mode keeps the fields legible instead of shadcn's dimmed disabled
  // state; edit mode switches to live, themed inputs.
  const fieldClassName = isEditing
    ? "h-11 bg-background"
    : "h-11 border-border bg-muted/40 disabled:cursor-default disabled:opacity-100";

  return (
    <div className="space-y-6">
      <ProfileAvatarSection
        user={user}
        updateProfilePicture={updateProfilePicture}
        isUpdatingPicture={isUpdatingPicture}
        isBusy={isBusy}
      />

      {/* Details sheet */}
      <section className={sheet}>
        <div className="flex items-center justify-between gap-4">
          <p className={microLabel}>Details</p>
          {isEditing && (
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-foreground">
              Editing
            </p>
          )}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmitProfile)}
            noValidate
            className="mt-4 space-y-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(FIELD_LABELS).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={microLabel}>{label}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type={name === "email" ? "email" : "text"}
                          placeholder={
                            name === "phone" ? "Not provided" : label
                          }
                          disabled={!isEditing || isBusy}
                          className={fieldClassName}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ))}

              {/* Role is assigned server-side, read only here */}
              <div className="space-y-2">
                <p className={microLabel}>Role</p>
                <p className="flex h-11 items-center font-mono text-xs font-bold uppercase tracking-tight text-foreground">
                  {user.role || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelProfileEdit}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBusy}>
                    {isUpdatingProfile ? (
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
                </>
              )}
            </div>
          </form>
        </Form>
      </section>
    </div>
  );
};

ProfileInfoTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    role: PropTypes.string,
    profilePicture: PropTypes.string,
  }).isRequired,
  kind: PropTypes.oneOf(["user", "admin"]).isRequired,
};

export default ProfileInfoTab;
