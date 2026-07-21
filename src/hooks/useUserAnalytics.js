// src/hooks/useUserAnalytics.js
//
// React Query hooks for the attendant's personal analytics slices.
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as analytics from "@/api/user-analytics";
import { queryKeys } from "@/api/query-keys";

const rangeQuery = (key, fn, params) => ({
  queryKey: key(params),
  queryFn: () => fn(params),
  placeholderData: keepPreviousData,
});

export const useGetUserNowNext = () =>
  useQuery({
    queryKey: queryKeys.userAnalytics.nowNext,
    queryFn: analytics.getUserNowNext,
    // The check-in state changes as the user acts; keep it fresh.
    refetchInterval: 60_000,
  });

export const useGetUserKpis = (params = {}) =>
  useQuery(rangeQuery(queryKeys.userAnalytics.kpis, analytics.getUserKpis, params));

export const useGetUserAttendanceTrend = (params = {}) =>
  useQuery(rangeQuery(queryKeys.userAnalytics.trend, analytics.getUserAttendanceTrend, params));

export const useGetUserStatusBreakdown = (params = {}) =>
  useQuery(rangeQuery(queryKeys.userAnalytics.statusBreakdown, analytics.getUserStatusBreakdown, params));

export const useGetUserEventBreakdown = (params = {}) =>
  useQuery(rangeQuery(queryKeys.userAnalytics.eventBreakdown, analytics.getUserEventBreakdown, params));

export const useGetUserCalendar = (params = {}) =>
  useQuery(rangeQuery(queryKeys.userAnalytics.calendar, analytics.getUserCalendar, params));
