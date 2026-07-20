// src/components/attendance/reports/AttendanceReportDisplay.jsx
import * as React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGetAttendanceReport } from "@/hooks/useAttendanceReports";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { format } from "date-fns";

export const AttendanceReportDisplay = ({ params, onPageChange }) => {
  const { data, error, isError, isLoading, refetch } =
    useGetAttendanceReport(params);

  const handleRefresh = React.useCallback(() => refetch(), [refetch]);

  if (isError) {
    const msg = extractApiErrorMessage(error).message;
    return <ErrorMessage error={msg} onRetry={handleRefresh} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary Skeleton */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2" />
                <div className="h-3 bg-muted rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { data: attendances, topAttendees, summary, meta } = data;

  // Truly empty (no records at all, no filters narrowing the result):
  // show only the designed empty state - no toolbar, summary or table.
  const hasActiveFilters = Object.entries(params).some(
    ([key, value]) =>
      !["page", "limit"].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== ""
  );
  const noRecordsAtAll = (meta?.total || 0) === 0 && !hasActiveFilters;

  if (noRecordsAtAll) {
    return (
      <EmptyState
        eyebrow="Reports"
        title="No attendance records yet"
        description="Reports build up as attendants check in to events."
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />
    );
  }

  const statusChipBase =
    "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight";

  const getStatusChipClass = (status) => {
    switch (status) {
      case "PRESENT":
        return `${statusChipBase} bg-[#dcf5e9] text-[#1a7f53]`;
      case "LATE":
        return `${statusChipBase} bg-amber-100 text-amber-800`;
      case "ABSENT":
        return `${statusChipBase} bg-red-100 text-red-700`;
      default:
        return `${statusChipBase} bg-muted text-muted-foreground`;
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Results toolbar - the page header owns the title */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
          {meta?.total || 0} total
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Total Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display text-foreground">
              {summary?.totalAttendance || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display text-foreground">
              {summary?.presentCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalAttendance > 0
                ? `${(
                    (summary.presentCount / summary.totalAttendance) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display text-foreground">
              {summary?.lateCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalAttendance > 0
                ? `${(
                    (summary.lateCount / summary.totalAttendance) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display text-foreground">
              {summary?.absentCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalAttendance > 0
                ? `${(
                    (summary.absentCount / summary.totalAttendance) *
                    100
                  ).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Attendees */}
      {topAttendees && topAttendees.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="font-display font-normal tracking-[-0.02em]">
              Top Attendees
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Most active participants
            </p>
          </CardHeader>
          <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
            {topAttendees.map((attendee, index) => (
              <div
                key={attendee.userId}
                className="flex items-center justify-between gap-3 p-2 sm:p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-foreground font-semibold text-xs sm:text-sm flex-shrink-0">
                    #{index + 1}
                  </div>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage
                      src={attendee.profilePicture}
                      alt={attendee.userName}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(
                        attendee.userName?.split(" ")[0],
                        attendee.userName?.split(" ")[1]
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">
                      {attendee.userName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {attendee.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="px-2 sm:px-3 py-1 flex-shrink-0"
                >
                  {attendee.attendanceCount}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display font-normal tracking-[-0.02em]">
            Attendance Records
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed attendance information
          </p>
        </CardHeader>
        <CardContent>
          {attendances && attendances.length > 0 ? (
            <>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          User
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Event
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Location
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Session Date
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Check-In
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Check-Out
                        </th>
                        <th className="text-left p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((record) => (
                        <tr
                          key={record.attendanceId}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2 min-w-[180px]">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    record.userName?.split(" ")[0],
                                    record.userName?.split(" ")[1]
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate max-w-[150px]">
                                  {record.userName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {record.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="min-w-[180px]">
                              <p className="font-medium break-words hyphens-auto max-w-[200px]">
                                {record.eventTitle}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {record.eventType}
                                {record.isRecurring && " • Recurring"}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="min-w-[150px]">
                              <p className="text-sm break-words hyphens-auto max-w-[180px]">
                                {record.location?.name}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {record.location?.city},{" "}
                                {record.location?.country}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="whitespace-nowrap">
                              {format(
                                new Date(record.sessionStartDate),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="whitespace-nowrap">
                              {record.checkInTime
                                ? format(new Date(record.checkInTime), "HH:mm")
                                : "-"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="whitespace-nowrap">
                              {record.checkOutTime
                                ? format(new Date(record.checkOutTime), "HH:mm")
                                : "-"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`${getStatusChipClass(
                                record.status
                              )} whitespace-nowrap`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination: same minimal pattern as the shared component. */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={meta.page === 1}
                      onClick={() => onPageChange(meta.page - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={meta.page === meta.totalPages}
                      onClick={() => onPageChange(meta.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              {/* Filtered to zero: the filters stay visible so they can be
                  cleared; keep this note light. */}
              <p className="text-sm text-muted-foreground">
                No matches for the current filters - clear or adjust them to
                see records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

AttendanceReportDisplay.propTypes = {
  params: PropTypes.shape({
    page: PropTypes.number,
    limit: PropTypes.number,
    search: PropTypes.string,
    userId: PropTypes.number,
    eventName: PropTypes.string,
    locationName: PropTypes.string,
    status: PropTypes.string,
    isRecurring: PropTypes.bool,
    eventType: PropTypes.string,
    checkInStartDate: PropTypes.string,
    checkInEndDate: PropTypes.string,
    sessionStartDate: PropTypes.string,
    sessionEndDate: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
};
