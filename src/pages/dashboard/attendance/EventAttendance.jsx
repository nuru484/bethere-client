// src/pages/dashboard/EventAttendancePage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceDataTable } from "@/components/attendance-table/AttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import AsyncBoundary from "@/components/ui/AsyncBoundary";
import { useGetEventAttendance } from "@/hooks/useAttendance";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";

// Filter fields this page owns (a numeric search term also matches the
// session id server-side, so there is no separate sessionId filter).
const FILTER_KEYS = ["search", "status", "startDate", "endDate"];

const EventAttendancePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Page, page size and filters live in the URL so refresh/back/share keep
  // the same view.
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
  } = useGetEventAttendance(eventId, queryParams);

  const attendanceRecords = attendanceData?.data;
  const totalCount = attendanceData?.meta?.total || 0;

  const eventDetails = attendanceRecords?.[0]?.session?.event;
  const eventTitle = eventDetails?.title || "Event";

  // The status breakdown is only available for the records on the current
  // page (the API returns just the page + a filtered total, no per-status
  // totals), so every derived stat below is page-scoped and labelled as such.
  const pageCount = attendanceRecords?.length || 0;

  const absentCount =
    attendanceRecords?.filter((a) => a.status === "ABSENT").length || 0;

  const presentCount =
    attendanceRecords?.filter((a) => a.status === "PRESENT").length || 0;

  const absentRate =
    pageCount > 0 ? ((absentCount / pageCount) * 100).toFixed(1) : 0;

  const attendanceRate =
    pageCount > 0 ? ((presentCount / pageCount) * 100).toFixed(1) : 0;

  // setPageSize and setFilters already reset the page to 1.
  const handlePageChange = setPage;
  const handlePageSizeChange = setPageSize;
  const handleFiltersChange = setFilters;

  return (
    <AsyncBoundary
      isLoading={isLoading && !attendanceRecords}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<DataTableSkeleton />}
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
              {eventTitle}
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Check-ins recorded for this event
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
          >
            Back
          </Button>
        </div>

        {/* Stats Cards - text-first, hidden when there is nothing to count */}
        {totalCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Total Attendees
                </p>
                <p className="text-xl sm:text-2xl font-display text-foreground mt-0.5">
                  {totalCount}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  across all pages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Absent
                </p>
                <p className="text-xl sm:text-2xl font-display text-foreground mt-0.5">
                  {absentCount}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {`${absentRate}% on this page`}
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
                  {presentCount} present
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <AttendanceDataTable
            context="event"
            data={attendanceRecords || []}
            loading={isLoading}
            fetching={isFetching && !isLoading}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </div>
      </div>
    </AsyncBoundary>
  );
};

export default EventAttendancePage;
