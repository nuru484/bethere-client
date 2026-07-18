// src/pages/dashboard/EventAttendancePage.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ArrowLeft, UserX } from "lucide-react";
import { EventAttendanceDataTable } from "@/components/attendance/tables/eventAttendance/EventAttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useGetEventAttendance } from "@/hooks/useAttendance";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const EventAttendancePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    search: undefined,
    status: undefined,
    sessionId: undefined,
    startDate: undefined,
    endDate: undefined,
  });

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
    isError,
    error,
    refetch,
  } = useGetEventAttendance(eventId, queryParams);

  const attendanceRecords = attendanceData?.data;
  const totalCount = attendanceData?.meta?.total || 0;

  const eventDetails = attendanceRecords?.[0]?.session?.event;
  const eventTitle = eventDetails?.title || "Event";

  const absentCount =
    attendanceRecords?.filter((a) => a.status === "ABSENT").length || 0;

  const presentCount =
    attendanceRecords?.filter((a) => a.status === "PRESENT").length || 0;

  const attendanceRate =
    totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  const handlePageChange = (newPage) => setPage(newPage);

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1);
  }, []);

  if (isLoading && !attendanceRecords) {
    return <DataTableSkeleton />;
  }

  const { message } = extractApiErrorMessage(error);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-96 px-4">
        <ErrorMessage error={message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-4 sm:space-y-6 py-4 sm:py-6">
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-0">
          {/* Back button - Top right on mobile, inline on desktop */}
          <div className="flex justify-end sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 h-8"
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </div>

          {/* Event info and back button container */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                  <span className="block sm:inline">{eventTitle}</span>
                  <span className="hidden sm:inline mx-1.5">-</span>
                  <span className="block sm:inline text-gray-700">
                    Attendance
                  </span>
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug">
                  Manage and view event attendance records
                </p>
              </div>
            </div>

            {/* Back button - Desktop only */}
            <Button
              variant="outline"
              className="hidden sm:flex border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    Total Attendees
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                    {totalCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    registered users
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                  <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    Absent
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                    {absentCount}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {totalCount > 0
                      ? `${((absentCount / totalCount) * 100).toFixed(
                          1
                        )}% of total`
                      : "no data"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    Attendance Rate
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                    {attendanceRate}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {presentCount} present
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <EventAttendanceDataTable
            data={attendanceRecords || []}
            loading={isLoading}
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
  );
};

export default EventAttendancePage;
