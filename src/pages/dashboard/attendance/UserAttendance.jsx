// src/pages/dashboard/UserAttendancePage.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttendanceDataTable } from "@/components/attendance/tables/userAttendance/AttendanceDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import { useGetUserAttendance } from "@/hooks/useAttendance";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const UserAttendancePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    search: undefined,
    status: undefined,
    eventType: undefined,
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
  } = useGetUserAttendance(userId, queryParams);

  const attendanceRecords = attendanceData?.data;
  const userDetails = attendanceRecords?.[0]?.user;

  const userName = userDetails
    ? `${userDetails.firstName} ${userDetails.lastName}`
    : "User";

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

  const handleRefresh = () => refetch();

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
      <div className="container mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-0">
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
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs sm:text-sm font-semibold">
                  {`${userDetails?.firstName?.[0] ?? ""}${
                    userDetails?.lastName?.[0] ?? ""
                  }`.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                  {userName}&apos;s Attendance
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>
                    View and manage this user&apos;s attendance records
                  </span>
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

        {/* Attendance Data Table */}
        <div className="overflow-hidden">
          <AttendanceDataTable
            data={attendanceRecords || []}
            loading={isLoading}
            totalCount={attendanceData?.meta?.total || 0}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default UserAttendancePage;
