// src/components/event/EventListItemSkeleton.jsx
//
// Mirrors the EventListItem card anatomy exactly: cover area, micro-label
// row, two-line title, text-only meta lines, action chip row.
import { Skeleton } from "@/components/ui/skeleton";

const EventListItemSkeleton = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Cover */}
      <Skeleton className="aspect-video w-full rounded-none border-b border-border" />

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Micro-label row */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        {/* Title */}
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* Meta lines */}
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-24" />
        </div>

        {/* Action row */}
        <div className="mt-auto flex gap-2 pt-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default EventListItemSkeleton;
