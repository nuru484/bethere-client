// src/pages/dashboard/UserAttendancePage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { AttendanceDataTable } from "@/components/attendance-table/AttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import { useGetUserAttendance } from "@/hooks/useAttendance";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

// Module-level constant: usePaginatedListState needs a stable identity.
const FILTER_KEYS = ["search", "status", "eventType", "startDate", "endDate"];

const UserAttendancePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // URL-backed like the sibling list pages: refresh, back/forward and shared
  // links keep the page and filters (this page previously used useState).
  const { page, pageSize, filters, setPage, setPageSize, setFilters } =
    usePaginatedListState({ filterKeys: FILTER_KEYS });

  const queryParams = {
    page,
    limit: pageSize,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    ),
  };

  const {
    data: attendanceData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetUserAttendance(userId, queryParams);

  const attendanceRecords = attendanceData?.data;
  const userDetails = attendanceRecords?.[0]?.user;

  const userName = userDetails
    ? `${userDetails.firstName} ${userDetails.lastName}`
    : "User";

  if (isLoading && !attendanceRecords) {
    return <DataTableSkeleton />;
  }

  const { message } = extractApiErrorMessage(error);

  // Known case: the user does not exist (404). Render a designed empty
  // state inside the page layout instead of the generic error surface.
  if (isError && error?.status === 404) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-4 sm:py-6">
          <EmptyState
            eyebrow="Attendance"
            title="No attendance found"
            description={message}
            action={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  Go back
                </Button>
                <Button size="sm" onClick={() => navigate("/dashboard")}>
                  Home
                </Button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-96 px-4">
        <ErrorMessage error={message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-4 sm:space-y-6">
        {/* Header: mono eyebrow + display title */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Attendance
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              {userName}
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Check-in history across all events
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <AttendanceDataTable
            context="user"
            data={attendanceRecords || []}
            loading={isLoading}
            fetching={isFetching && !isLoading}
            totalCount={attendanceData?.meta?.total || 0}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
};

export default UserAttendancePage;
