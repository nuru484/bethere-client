// src/hooks/useReview.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAuditLogs, getAnomalies, resolveAnomaly } from "@/api/review";
import { queryKeys } from "@/api/query-keys";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

// Deliberate overrides on both review queries: this is a live moderation
// queue, so it goes stale in seconds (not the global 5 minutes), is dropped
// from the cache quickly, and fails fast with a single retry. The 30s
// staleTime only pays off with focus refetching on (the global default is
// off): coming back to the tab is exactly when a moderator expects to see
// anomalies raised while they were away.
export const useAnomalies = (params = {}) =>
  useQuery({
    queryKey: queryKeys.review.anomalies(params),
    queryFn: () => getAnomalies(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useAuditLogs = (params = {}) =>
  useQuery({
    queryKey: queryKeys.review.auditLogs(params),
    queryFn: () => getAuditLogs(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useResolveAnomaly = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (anomalyId) => resolveAnomaly(anomalyId),
    onSuccess: (response) => {
      toast.success(response?.message || "Anomaly marked as resolved.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.review.anomaliesAll,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.review.auditLogsAll,
      });
    },
    onError: (error) => {
      const { message } = extractApiErrorMessage(error);
      toast.error(message || "Failed to resolve the anomaly.");
    },
  });
};
