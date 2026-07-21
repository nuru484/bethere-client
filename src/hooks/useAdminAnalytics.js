// src/hooks/useAdminAnalytics.js
//
// React Query hooks for the admin analytics slices. Each range-driven slice
// keeps its previous data while a new period loads, so switching the date
// range never flashes the whole board back to skeletons.
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import * as analytics from "@/api/admin-analytics";
import { queryKeys } from "@/api/query-keys";

const rangeQuery = (key, fn, params) => ({
  queryKey: key(params),
  queryFn: () => fn(params),
  placeholderData: keepPreviousData,
});

export const useGetAdminLiveSnapshot = () =>
  useQuery({
    queryKey: queryKeys.analytics.live,
    queryFn: analytics.getAdminLiveSnapshot,
    // The floor changes minute to minute; keep the "now" strip fresh.
    refetchInterval: 60_000,
  });

export const useGetAdminKpis = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.kpis, analytics.getAdminKpis, params));

export const useGetPresenceTrend = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.presenceTrend, analytics.getPresenceTrend, params));

export const useGetPresenceBreakdown = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.presenceBreakdown, analytics.getPresenceBreakdown, params));

export const useGetPunctualityTrend = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.punctualityTrend, analytics.getPunctualityTrend, params));

export const useGetLatenessDistribution = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.latenessDistribution, analytics.getLatenessDistribution, params));

export const useGetArrivalHeatmap = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.arrivalHeatmap, analytics.getArrivalHeatmap, params));

export const useGetAnomalyTrend = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.anomalyTrend, analytics.getAnomalyTrend, params));

export const useGetAnomalyBreakdown = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.anomalyBreakdown, analytics.getAnomalyBreakdown, params));

export const useGetLivenessQuality = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.livenessQuality, analytics.getLivenessQuality, params));

export const useGetIntegritySummary = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.integritySummary, analytics.getIntegritySummary, params));

export const useGetTopAttendees = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.topAttendees, analytics.getTopAttendees, params));

export const useGetRetentionCurve = (params = {}) =>
  useQuery(rangeQuery(queryKeys.analytics.retentionCurve, analytics.getRetentionCurve, params));

export const useGenerateAiSummary = () =>
  useMutation({ mutationFn: (params) => analytics.generateAiSummary(params) });
