// src/hooks/useDashboard.js
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getAdminDashboardTotals,
  getAllUsersAttendanceData,
  getUserDashboardTotals,
  getRecentEvents,
  getUserAttendanceData,
} from "@/api/dashboard";

export const useGetAdminDashboardTotals = () => {
  return useQuery({
    queryKey: ["adminDashboardTotals"],
    queryFn: getAdminDashboardTotals,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useGetAllUsersAttendanceData = (params = {}) => {
  const queryKey = ["allUsersAttendanceData", params];

  return useQuery({
    queryKey,
    queryFn: () => getAllUsersAttendanceData(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

export const useGetUserDashboardTotals = () => {
  return useQuery({
    queryKey: ["userDashboardTotals"],
    queryFn: getUserDashboardTotals,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useGetRecentEvents = () => {
  return useQuery({
    queryKey: ["recentEvents"],
    queryFn: getRecentEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useGetUserAttendanceData = (params = {}) => {
  const queryKey = ["usersAttendanceData", params];

  return useQuery({
    queryKey,
    queryFn: () => getUserAttendanceData(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};
