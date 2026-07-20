// src/components/dashboard/skeletons/DashboardSkeleton.jsx
import DashboardTotalsCardSkeleton from "./DashboardTotalsCardSkeleton";
import DateRangeSelectorSkeleton from "./DateRangeSelectorSkeleton";

const DashboardSkeleton = () => {
  return (
    <div className="w-full min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-full max-w-96 bg-muted rounded animate-pulse"></div>
          </div>
          <DateRangeSelectorSkeleton />
        </div>

        <DashboardTotalsCardSkeleton />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
