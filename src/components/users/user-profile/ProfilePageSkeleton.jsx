// src/components/users/user-profile/ProfilePageSkeleton.jsx
//
// Content-shaped loading state mirroring UserProfilePage: eyebrow + display
// name header, tab bar, then the picture and details sheets.
import { Skeleton } from "@/components/ui/skeleton";
import { sheet } from "./profile-styles";

export const ProfileSkeleton = () => (
  <div className="container mx-auto max-w-3xl space-y-6">
    {/* Header: eyebrow + name */}
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-9 w-56 sm:h-10" />
    </div>

    {/* Tab bar */}
    <Skeleton className="h-11 w-full rounded-lg" />

    {/* Picture sheet */}
    <div className={sheet}>
      <Skeleton className="h-3 w-24" />
      <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>
    </div>

    {/* Details sheet */}
    <div className={sheet}>
      <Skeleton className="h-3 w-16" />
      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  </div>
);
