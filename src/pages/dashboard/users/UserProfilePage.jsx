// src/pages/dashboard/users/UserProfilePage.jsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileInfoTab from "@/components/users/user-profile/ProfileInfoTab";
import SecurityTab from "@/components/users/user-profile/SecurityTab";
import { ProfileSkeleton } from "@/components/users/user-profile/ProfilePageSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { microLabel } from "@/components/users/user-profile/profile-styles";
import { useAuth } from "@/hooks/useAuth";
import { useGetProfile, resolveProfileKind } from "@/hooks/useProfile";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const UserProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const isAdmin = currentUser?.role === "ADMIN";
  const isViewingOwnProfile = parseInt(currentUser?.id) === parseInt(userId);

  // "admin" only for an admin's own profile: their principal lives under
  // /admins, everyone else (and every browsed attendant) under /users.
  const profileKind = resolveProfileKind({
    isOwnProfile: isViewingOwnProfile,
    role: currentUser?.role,
  });

  // Own profiles come straight from the auth context; only an admin browsing
  // someone else's profile needs a fetch.
  const shouldFetchProfile = isAdmin && !isViewingOwnProfile;

  const {
    data: profileData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetProfile(userId, {
    kind: profileKind,
    enabled: shouldFetchProfile && !!userId,
  });

  const { message: errorMessage } = extractApiErrorMessage(error);

  const displayUser =
    shouldFetchProfile && profileData?.data ? profileData.data : currentUser;

  if (isLoading && shouldFetchProfile) {
    return <ProfileSkeleton />;
  }

  if (isError && shouldFetchProfile) {
    return <ErrorMessage error={errorMessage} onRetry={refetch} />;
  }

  const displayName =
    displayUser?.firstName || displayUser?.lastName
      ? `${displayUser?.firstName ?? ""} ${displayUser?.lastName ?? ""}`.trim()
      : displayUser?.email;

  return (
    <div className="container mx-auto max-w-3xl space-y-6">
      {/* Page header: mono eyebrow + display-face name */}
      <header className="space-y-1">
        <p className={microLabel}>
          {shouldFetchProfile ? "Profile - Administrator view" : "Profile"}
        </p>
        <h1 className="break-words font-display text-3xl font-normal tracking-[-0.03em] text-foreground sm:text-4xl">
          {displayName}
        </h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="profile"
            className="font-mono text-xs uppercase tracking-tight"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="font-mono text-xs uppercase tracking-tight"
            disabled={!isViewingOwnProfile}
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileInfoTab user={displayUser} kind={profileKind} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {isViewingOwnProfile && <SecurityTab kind={profileKind} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
