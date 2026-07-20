// src/hooks/useAttendanceReports.jsx
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAttendanceReport } from "@/api/attendance-reports.js";
import { queryKeys } from "@/api/query-keys";

/**
 * Hook to fetch comprehensive attendance report
 * @param {Object} params - Filter parameters
 * @param {Object} options - Additional react-query options
 */
export const useGetAttendanceReport = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.attendance.report(params),
    queryFn: () => getAttendanceReport(params),
    // Focus refetch on (against the global default): the report aggregates
    // live check-ins, so a tab returned to mid-event must not keep showing
    // pre-event totals for the full 5-minute staleTime.
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    ...options,
  });
};
