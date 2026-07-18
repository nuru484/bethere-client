// src/pages/dashboard/UserEventAttendancePage.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, ArrowLeft, XCircle } from "lucide-react";
import { UserEventAttendanceDataTable } from "@/components/attendance/tables/userEventAttendance/UserEventAttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useGetUserEventAttendance } from "@/hooks/useAttendance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const UserEventAttendancePage = () => {
  const { userId, eventId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
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
      <div className="flex items-center justify-center min-h-96">
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
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </div>

          {/* User info and back button container */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 ring-2 ring-gray-200 ring-offset-2">
                <AvatarImage src={userDetails?.profilePicture} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs sm:text-sm font-semibold">
                  {`${userDetails?.firstName?.[0] ?? ""}${
                    userDetails?.lastName?.[0] ?? ""
                  }`.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                  <span className="block sm:inline">{userName}</span>
                  <span className="hidden sm:inline mx-1.5">-</span>
                  <span className="block sm:inline text-gray-700">
                    {eventTitle}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug">
                  {isRecurring
                    ? "View attendance history for this recurring event"
                    : "View attendance of this user for this event"}
                </p>
              </div>
            </div>

            {/* Back button - Desktop only */}
            <Button
              variant="outline"
              className="hidden sm:flex border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Stats Cards - Only show for recurring events */}
        {isRecurring && totalCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                    <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      Sessions Attended
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                      {sessionsAttended}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      out of {totalCount} sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                    <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      Absent Days
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                      {absentDays}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      missed sessions
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
                      overall performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Non-recurring event message */}
        {!isRecurring && totalCount > 0 && (
          <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-900">
                    This is a one-time event
                  </p>
                  <p className="text-[10px] sm:text-xs text-blue-700 mt-0.5 sm:mt-1 leading-relaxed">
                    Showing the attendance record for this single occurrence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <UserEventAttendanceDataTable
            data={attendanceRecords || []}
            loading={isLoading}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFiltersChange={handleFiltersChange}
            isRecurring={isRecurring}
          />
        </div>
      </div>
    </div>
  );
};

export default UserEventAttendancePage;
