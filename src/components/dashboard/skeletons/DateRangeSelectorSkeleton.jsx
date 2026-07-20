// src/components/dashboard/skeletons/DateRangeSelectorSkeleton.jsx
const DateRangeSelectorSkeleton = () => {
  return (
    <div className="animate-pulse space-y-1.5">
      <div className="h-3 w-12 rounded bg-muted"></div>
      <div className="h-9 w-full rounded-lg bg-muted sm:w-44"></div>
    </div>
  );
};

export default DateRangeSelectorSkeleton;
