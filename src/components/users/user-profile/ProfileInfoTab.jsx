// src/components/user-profile/ProfileInfoTab.jsx
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  Loader2,
  Save,
  Edit3,
  Camera,
  X,
  ZoomIn,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUpdateUserProfile,
  useUpdateUserProfilePicture,
} from "@/hooks/useUsers";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import PropTypes from "prop-types";
import { profileFormSchema } from "@/validation/user/profileValidation";
import { useAuth } from "@/hooks/useAuth";
import heic2any from "heic2any";

const ProfileInfoTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const { user: currentUser, login: logUserIn } = useAuth();
  const isViewingOwnProfile = currentUser?.id === user?.id;
  const { mutateAsync: updateProfile, isLoading: isUpdatingProfile } =
    useUpdateUserProfile();
  const { mutateAsync: updateProfilePicture, isLoading: isUpdatingPicture } =
    useUpdateUserProfilePicture();
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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    setIsEditingAvatar(true);
    try {
      const isHeic =
        file.name.toLowerCase().endsWith(".heic") ||
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.type === "";
      let previewBlob = file;
      if (isHeic) {
        try {
          previewBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
          });
        } catch {
          toast.error("Failed to preview HEIC file");
          setIsProcessingImage(false);
          setIsEditingAvatar(false);
          return;
        }
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        setIsProcessingImage(false);
        setIsEditingAvatar(false);
        return;
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      const previewUrl = URL.createObjectURL(previewBlob);
      setImagePreview(previewUrl);
      setSelectedAvatarFile(file);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
      setIsEditingAvatar(false);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedAvatarFile(null);
    setIsEditingAvatar(false);
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
        userId: user.id,
        userData: {
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
            form.setError(field, {
              message: errorMessage,
            });
          }
        });
        toast.error(message);
      } else {
        toast.error(message);
      }
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
        userId: user.id,
        formData,
      });
      toast.dismiss(toastId);
      toast.success(
        response.message || "Profile picture updated successfully!"
      );
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

  const handleAvatarClick = () => {
    if (user.profilePicture || imagePreview) {
      setIsImageViewerOpen(true);
    }
  };

  const isLoading = isUpdatingProfile || isUpdatingPicture;
  const hasImage = user.profilePicture || imagePreview;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
          <User className="h-6 w-6 text-primary" />
          Profile Information
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your personal information and account details
        </p>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border-2 border-border rounded-lg bg-card shadow-sm">
          <div className="relative group">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-upload"
              accept="image/*,.heic,.heif"
              disabled={isLoading || isProcessingImage}
            />
            <div className="relative">
              <Avatar
                className={`h-24 w-24 ring-4 transition-all duration-200 ${
                  isEditingAvatar
                    ? "ring-primary shadow-lg shadow-primary/20"
                    : "ring-primary/20 dark:ring-primary/30"
                }`}
              >
                <AvatarImage
                  src={(imagePreview || user.profilePicture) ?? undefined}
                  alt={`${user.firstName} ${user.lastName}`}
                  className={`object-cover ${
                    hasImage && !isProcessingImage
                      ? "cursor-pointer hover:opacity-90 transition-opacity"
                      : ""
                  }`}
                  onClick={
                    hasImage && !isProcessingImage
                      ? handleAvatarClick
                      : undefined
                  }
                />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground font-bold text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {/* Processing Overlay */}
              {isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {/* Zoom Icon on Hover - Only if image exists and not processing */}
              {hasImage && !isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            {!isEditingAvatar && !isProcessingImage && (
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => {
                  document.getElementById("avatar-upload")?.click();
                }}
                disabled={isLoading}
                title="Change profile picture"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
            {/* Remove Preview Button */}
            {imagePreview && !isProcessingImage && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-lg"
                onClick={removePreview}
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {/* New Badge */}
            {imagePreview && !isProcessingImage && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <Badge className="text-xs px-2.5 py-0.5 bg-primary text-primary-foreground shadow-md font-semibold">
                  New
                </Badge>
              </div>
            )}
            {/* Processing Badge */}
            {isProcessingImage && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <Badge className="text-xs px-2.5 py-0.5 bg-orange-500 text-white shadow-md font-semibold">
                  Processing...
                </Badge>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              Profile Picture
              {!isEditingAvatar && !isProcessingImage && (
                <Camera
                  className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    document.getElementById("avatar-upload")?.click();
                  }}
                  title="Click to change"
                />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProcessingImage
                ? "Processing image, please wait..."
                : isEditingAvatar
                ? "Select a new image (Max 5MB, JPG, PNG, GIF, or HEIC)"
                : hasImage
                ? "Click image to view full size • Hover to change"
                : "Hover over avatar or click camera icon to upload"}
            </p>
            {imagePreview && !isProcessingImage && (
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitProfilePicture}
                  disabled={isUpdatingPicture}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-md"
                >
                  {isUpdatingPicture ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3 w-3" />
                      Save Picture
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removePreview}
                  disabled={isUpdatingPicture}
                  className="text-xs font-medium border-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Edit Mode Indicator */}
        {isEditing && (
          <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 dark:border-primary/40 rounded-lg p-4 animate-in fade-in-50 duration-300 shadow-sm">
            <p className="text-sm font-semibold text-primary dark:text-primary flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Edit Mode Active - Make your changes below
            </p>
          </div>
        )}
        {/* Profile Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmitProfile)}
            className="space-y-6"
          >
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your first name"
                        disabled={!isEditing || isLoading}
                        className={`h-11 font-medium transition-all duration-200 ${
                          isEditing
                            ? "border-2 border-primary/40 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                            : "border-2 border-border bg-muted/50 text-foreground"
                        }`}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />
              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your last name"
                        disabled={!isEditing || isLoading}
                        className={`h-11 font-medium transition-all duration-200 ${
                          isEditing
                            ? "border-2 border-primary/40 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                            : "border-2 border-border bg-muted/50 text-foreground"
                        }`}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        disabled={!isEditing || isLoading}
                        className={`h-11 font-medium transition-all duration-200 ${
                          isEditing
                            ? "border-2 border-primary/40 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                            : "border-2 border-border bg-muted/50 text-foreground"
                        }`}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter your phone number"
                        disabled={!isEditing || isLoading}
                        className={`h-11 font-medium transition-all duration-200 ${
                          isEditing
                            ? "border-2 border-primary/40 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
                            : "border-2 border-border bg-muted/50 text-foreground"
                        }`}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium" />
                  </FormItem>
                )}
              />
              {/* Role (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Role
                </label>
                <div className="h-11 px-3 py-2 border-2 border-border bg-muted/50 rounded-md flex items-center font-medium text-foreground">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary font-semibold border border-primary/20"
                  >
                    {user.role || "Not provided"}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <Separator className="my-6 bg-border" />
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelProfileEdit}
                    size="lg"
                    className="w-full sm:w-auto border-2 border-border hover:bg-muted hover:border-foreground/20 font-semibold"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                    disabled={isLoading}
                  >
                    {isUpdatingProfile ? (
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
                </>
              )}
            </div>
          </form>
        </Form>
      </div>
      {/* Full Screen Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {user.firstName} {user.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh] bg-muted/30 flex items-center justify-center">
            <img
              src={imagePreview || user.profilePicture}
              alt={`${user.firstName} ${user.lastName}`}
              className="max-w-full max-h-full object-contain"
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
};

export default ProfileInfoTab;
