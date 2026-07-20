// src/components/users/user-profile/ProfileInfoTab.jsx
//
// Paper-and-ink profile sheet: mono micro-labels over plain fields, a simple
// ring-bordered avatar, and an inline edit mode. Data access is role-aware
// via the profile `kind` ("user" | "admin"), so an admin editing their own
// profile hits /admins instead of /users.
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { compressImage } from "@/lib/compress-image";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { microLabel, sheet } from "./profile-styles";
import { useUpdateProfile, useUpdateProfilePicture } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { profileFormSchema } from "@/validation/user/profileValidation";

const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
};

const ProfileInfoTab = ({ user, kind }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // Leaving the tab with a pending preview would otherwise leak the blob:
  // replace/discard revoke it, unmount has to as well.
  const imagePreviewRef = useRef(null);
  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);
  useEffect(
    () => () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    },
    []
  );

  const { user: currentUser, login: logUserIn } = useAuth();
  const isViewingOwnProfile = currentUser?.id === user?.id;

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile(kind);
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

  const userInitials = `${user.firstName?.charAt(0) || ""}${
    user.lastName?.charAt(0) || ""
  }`.toUpperCase();
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Guard only against absurdly large originals (decoding cost); the image is
    // compressed below, so a normal multi-MB phone photo is fine.
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image is too large. Please choose one under 25MB.");
      e.target.value = "";
      return;
    }
    setIsProcessingImage(true);
    try {
      const isHeic =
        file.name.toLowerCase().endsWith(".heic") ||
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.type === "";
      let sourceBlob = file;
      if (isHeic) {
        try {
          // heic2any is ~1.2 MB; load it only when a HEIC file is picked so it
          // stays out of the eager profile chunk.
          const { default: heic2any } = await import("heic2any");
          sourceBlob = await heic2any({ blob: file, toType: "image/jpeg" });
        } catch {
          toast.error("Failed to read HEIC file");
          return;
        }
      }
      // Downscale + re-encode before upload so we ship ~a few hundred KB, not
      // the full-resolution original. The COMPRESSED file is what gets uploaded.
      const compressed = await compressImage(sourceBlob, {
        maxDimension: 1024,
        quality: 0.82,
        fileName: `${(file.name || "avatar").replace(/\.[^.]+$/, "")}.jpg`,
      });
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(compressed));
      setSelectedAvatarFile(compressed);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
      setIsProcessingImage(false);
      // Allow re-selecting the same file after a discard.
      e.target.value = "";
    }
  };

  const removePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedAvatarFile(null);
  };

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

  const handleSubmitProfilePicture = async () => {
    if (!selectedAvatarFile) {
      toast.error("Please select an image first");
      return;
    }
    if (!selectedAvatarFile.type.startsWith("image/")) {
      toast.error("Invalid image file selected");
      return;
    }
    const toastId = toast.loading("Updating profile picture...");
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedAvatarFile);
      const response = await updateProfilePicture({
        profileId: user.id,
        formData,
      });
      toast.dismiss(toastId);
      toast.success(response.message || "Profile picture updated successfully!");
      if (isViewingOwnProfile && response.data) {
        logUserIn(response.data);
      }
      removePreview();
    } catch (err) {
      console.error("Profile picture update error:", err);
      toast.dismiss(toastId);
      const { message } = extractApiErrorMessage(err);
      toast.error(message);
    }
  };

  const isBusy = isUpdatingProfile || isUpdatingPicture;
  const hasImage = Boolean(imagePreview || user.profilePicture);

  const avatarCaption = isProcessingImage
    ? "Processing image..."
    : imagePreview
    ? "New picture selected. Save it or discard it."
    : "JPG, PNG, GIF or HEIC, up to 5MB.";

  // Read mode keeps the fields legible instead of shadcn's dimmed disabled
  // state; edit mode switches to live, themed inputs.
  const fieldClassName = isEditing
    ? "h-11 bg-background"
    : "h-11 border-border bg-muted/40 disabled:cursor-default disabled:opacity-100";

  return (
    <div className="space-y-6">
      {/* Picture sheet */}
      <section className={sheet}>
        <p className={microLabel}>Profile picture</p>
        <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setIsImageViewerOpen(true)}
            disabled={!hasImage || isProcessingImage}
            className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default"
            aria-label={hasImage ? "View profile picture" : "No profile picture"}
          >
            <Avatar className="h-20 w-20 ring-1 ring-border">
              <AvatarImage
                src={(imagePreview || user.profilePicture) ?? undefined}
                alt={fullName || user.email}
                className="object-cover"
              />
              <AvatarFallback className="bg-foreground font-mono text-xl font-bold text-background">
                {userInitials || "?"}
              </AvatarFallback>
            </Avatar>
            {isProcessingImage && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                <Loader2
                  className="h-6 w-6 animate-spin text-foreground"
                  strokeWidth={1.5}
                />
              </span>
            )}
          </button>

          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {avatarCaption}
            </p>
            <div className="flex flex-wrap gap-2">
              {!imagePreview ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy || isProcessingImage}
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  {hasImage ? "Change picture" : "Upload picture"}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitProfilePicture}
                    disabled={isUpdatingPicture}
                  >
                    {isUpdatingPicture ? (
                      <>
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          strokeWidth={1.5}
                        />
                        Saving...
                      </>
                    ) : (
                      "Save picture"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removePreview}
                    disabled={isUpdatingPicture}
                  >
                    Discard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-upload"
          accept="image/*,.heic,.heif"
          disabled={isBusy || isProcessingImage}
        />
      </section>

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

      {/* Full-size image viewer */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-h-[95vh] w-[95vw] max-w-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="font-display text-xl font-normal tracking-[-0.02em]">
              {fullName || user.email}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-[70vh] w-full items-center justify-center bg-muted/30">
            <img
              src={imagePreview || user.profilePicture}
              alt={fullName || user.email}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
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
