// src/components/users/user-profile/ProfileAvatarSection.jsx
//
// Avatar half of the profile sheet: the picture card (upload, preview,
// save/discard) plus the full-size image viewer dialog. The picture mutation
// stays in ProfileInfoTab because its pending state also disables the details
// form, so it arrives here as props.
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { compressImage } from "@/lib/compress-image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { microLabel, sheet } from "./profile-styles";
import { useAuth } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const ProfileAvatarSection = ({
  user,
  updateProfilePicture,
  isUpdatingPicture,
  isBusy,
}) => {
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

  const hasImage = Boolean(imagePreview || user.profilePicture);

  const avatarCaption = isProcessingImage
    ? "Processing image..."
    : imagePreview
    ? "New picture selected. Save it or discard it."
    : "JPG, PNG, GIF or HEIC, up to 5MB.";

  return (
    <>
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
    </>
  );
};

ProfileAvatarSection.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    profilePicture: PropTypes.string,
  }).isRequired,
  updateProfilePicture: PropTypes.func.isRequired,
  isUpdatingPicture: PropTypes.bool,
  isBusy: PropTypes.bool,
};

export default ProfileAvatarSection;
