// src/hooks/useDashboard.js
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getAdminDashboardTotals,
  getAllUsersAttendanceData,
  getUserDashboardTotals,
  getRecentEvents,
  getUserAttendanceData,
} from "@/api/dashboard";
import { queryKeys } from "@/api/query-keys";

export const useGetAdminDashboardTotals = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.adminTotals,
    queryFn: getAdminDashboardTotals,
  });
};

export const useGetAllUsersAttendanceData = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.dashboard.allUsersAttendanceData(params),
    queryFn: () => getAllUsersAttendanceData(params),
    placeholderData: keepPreviousData,
  });
};

export const useGetUserDashboardTotals = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.userTotals,
    queryFn: getUserDashboardTotals,
  });
};

export const useGetRecentEvents = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.recentEvents,
    queryFn: getRecentEvents,
  });
};

export const useGetUserAttendanceData = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.dashboard.userAttendanceData(params),
    queryFn: () => getUserAttendanceData(params),
    placeholderData: keepPreviousData,
  });
};
