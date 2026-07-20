// src/pages/dashboard/UserEventAttendancePage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceDataTable } from "@/components/attendance-table/AttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import AsyncBoundary from "@/components/ui/AsyncBoundary";
import { useGetUserEventAttendance } from "@/hooks/useAttendance";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

// Module-level constant: usePaginatedListState needs a stable identity.
const FILTER_KEYS = ["status", "sessionId", "startDate", "endDate"];

const UserEventAttendancePage = () => {
  const { userId, eventId } = useParams();
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
  } = useGetUserEventAttendance(userId, eventId, queryParams);

  const attendanceRecords = attendanceData?.data;
  const totalCount = attendanceData?.meta?.total || 0;

  // Get event and user details from the first record
  const eventDetails = attendanceRecords?.[0]?.session?.event;
  const userDetails = attendanceRecords?.[0]?.user;
  const isRecurring = eventDetails?.isRecurring || false;

  const eventTitle = eventDetails?.title || "Event";
  const userName = userDetails
    ? `${userDetails.firstName} ${userDetails.lastName}`
    : "User";

  // Calculate stats for recurring events
  const sessionsAttended =
    attendanceRecords?.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length || 0;

  const absentDays =
    attendanceRecords?.filter((a) => a.status === "ABSENT").length || 0;

  const attendanceRate =
    totalCount > 0 ? ((sessionsAttended / totalCount) * 100).toFixed(1) : 0;

  const { message } = extractApiErrorMessage(error);

  // Known case: the user or event does not exist (404). Render a designed
  // empty state inside the page layout instead of the generic error surface.
  // Checked before the AsyncBoundary so it wins over the generic error panel.
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

  return (
    <AsyncBoundary
      isLoading={isLoading && !attendanceRecords}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<DataTableSkeleton />}
      errorClassName="flex items-center justify-center min-h-96"
    >
      <div className="min-h-screen">
      <div className="container mx-auto space-y-4 sm:space-y-6 py-4 sm:py-6">
        {/* Header: mono eyebrow + display title */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Attendance
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              {userName}
            </h1>
            <p className="mt-1 break-words text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              {isRecurring
                ? `Session history for ${eventTitle}`
                : `Record for ${eventTitle}`}
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

        {/* Stats Cards - Only show for recurring events */}
        {isRecurring && totalCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Sessions Attended
                </p>
                <p className="text-xl sm:text-2xl font-display text-foreground mt-0.5">
                  {sessionsAttended}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  out of {totalCount} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Absent Days
                </p>
                <p className="text-xl sm:text-2xl font-display text-foreground mt-0.5">
                  {absentDays}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  missed sessions
                </p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-3 sm:p-4">
                <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Attendance Rate
                </p>
                <p className="text-xl sm:text-2xl font-display text-foreground mt-0.5">
                  {attendanceRate}%
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  overall performance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Non-recurring event message */}
        {!isRecurring && totalCount > 0 && (
          <Card className="bg-secondary">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                This is a one-time event
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed">
                Showing the attendance record for this single occurrence
              </p>
            </CardContent>
          </Card>
        )}

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <AttendanceDataTable
            context="userEvent"
            data={attendanceRecords || []}
            loading={isLoading}
            fetching={isFetching && !isLoading}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onFiltersChange={setFilters}
            isRecurring={isRecurring}
          />
        </div>
      </div>
      </div>
    </AsyncBoundary>
  );
};

export default UserEventAttendancePage;
