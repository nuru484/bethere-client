// src/hooks/useReview.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAuditLogs, getAnomalies, resolveAnomaly } from "@/api/review";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

export const useAnomalies = (params = {}) =>
  useQuery({
    queryKey: ["anomalies", params],
    queryFn: () => getAnomalies(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useAuditLogs = (params = {}) =>
  useQuery({
    queryKey: ["auditLogs", params],
    queryFn: () => getAuditLogs(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: 1,
  });

export const useResolveAnomaly = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (anomalyId) => resolveAnomaly(anomalyId),
    onSuccess: (response) => {
      toast.success(response?.message || "Anomaly marked as resolved.");
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    },
    onError: (error) => {
      const { message } = extractApiErrorMessage(error);
      toast.error(message || "Failed to resolve the anomaly.");
    },
  });
};
