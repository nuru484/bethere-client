// src/pages/UserDashboard.jsx
import { useState } from "react";
import {
  useGetUserDashboardTotals,
  useGetUserAttendanceData,
  useGetRecentEvents,
} from "@/hooks/useDashboard";
import DashboardTotalsCard from "@/components/dashboard/DashboardTotalsCard";
import DashboardTotalsCardSkeleton from "@/components/dashboard/skeletons/DashboardTotalsCardSkeleton";
import DashboardTotalsCardError from "@/components/dashboard/DashboardTotalsCardError";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import UserAttendanceSummaryCards from "@/components/dashboard/user/UserAttendanceSummaryCards";
import AttendanceLineChart from "@/components/dashboard/charts/AttendanceLineChart";
import StatusPieChart from "@/components/dashboard/charts/StatusPieChart";
import { statusPieData, eventTypePieData } from "@/lib/chart-colors";
import RecentEventsList from "@/components/dashboard/RecentEventsList";
import AttendanceDataSkeleton from "@/components/dashboard/skeletons/AttendanceDataSkeleton";
import AttendanceCardsError from "@/components/dashboard/AttendanceCardsError";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { format, subDays } from "date-fns";
import { Loader2 } from "lucide-react";
import ErrorMessage from "@/components/ui/ErrorMessage";

const UserDashboard = () => {
  const { data, isLoading, isError, error, refetch } =
    useGetUserDashboardTotals();

  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetUserAttendanceData(dateRange);

  const {
    data: recentEventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
    error: eventsError,
    refetch: refetchEvents,
  } = useGetRecentEvents();

  const totals = data?.data || {};
  const attendance = attendanceData?.data || {};
  const { summary, attendanceByDate } = attendance;

  const recentEvents = recentEventsData?.data || [];

  return (
    <div className="w-full min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Overview
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              My Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-1.5 sm:text-base">
              Your personal overview of events and attendance
            </p>
          </div>

          {/* Date Range Selector */}
          <DateRangeSelector
            onDateChange={setDateRange}
            isLoading={isAttendanceLoading}
          />
        </div>

        {/* Dashboard Totals Section */}
        {isLoading ? (
          <DashboardTotalsCardSkeleton />
        ) : isError ? (
          <DashboardTotalsCardError
            error={extractApiErrorMessage(error).message}
            onRetry={refetch}
          />
        ) : (
          <DashboardTotalsCard totals={totals} isAdmin={false} />
        )}

        {/* Attendance Data Section */}
        {isAttendanceLoading ? (
          <AttendanceDataSkeleton />
        ) : isAttendanceError ? (
          <AttendanceCardsError
            error={extractApiErrorMessage(attendanceError).message}
            onRetry={refetchAttendance}
          />
        ) : (
          summary && (
            <>
              {/* Summary Cards */}
              <UserAttendanceSummaryCards summary={summary} />

              {/* Charts */}
              {attendanceByDate && attendanceByDate.length > 0 && (
                <div className="space-y-6">
                  {/* Line Chart */}
                  <div className="w-full overflow-hidden">
                    <AttendanceLineChart
                      data={attendanceByDate}
                      title="My Attendance Trends"
                      emptyTitle="My Attendance Over Time"
                      totalLabel="Total Events"
                    />
                  </div>

                  {/* Pie Charts */}
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <div className="w-full overflow-hidden">
                      <StatusPieChart
                        data={statusPieData(summary.statusBreakdown)}
                        title="My Attendance Status"
                        emptyTitle="My Attendance Status"
                      />
                    </div>
                    <div className="w-full overflow-hidden">
                      <StatusPieChart
                        data={eventTypePieData(summary.eventTypeBreakdown)}
                        title="My Event Type Distribution"
                        emptyTitle="Event Type Distribution"
                        emptyMessage="No event data available"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* Recent Events Section */}
        <div className="w-full">
          {isEventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isEventsError ? (
            <div className="flex items-center justify-center py-8">
              <ErrorMessage
                error={extractApiErrorMessage(eventsError).message}
                onRetry={refetchEvents}
                title="Failed to load recent events"
              />
            </div>
          ) : (
            <RecentEventsList events={recentEvents} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
