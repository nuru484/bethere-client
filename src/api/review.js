// src/api/review.js
//
// Admin review surface: the audit log and the anomaly flags (with evidence)
// that the attendance flow records. Read-only except for resolving anomalies.
import { api } from ".";
import { buildSearchParams } from "./users";

export const getAuditLogs = async (params = {}) => {
  const qs = buildSearchParams(params);
  return api.get(`/review/audit-logs${qs ? `?${qs}` : ""}`);
};

export const getAnomalies = async (params = {}) => {
  const qs = buildSearchParams(params);
  return api.get(`/review/anomalies${qs ? `?${qs}` : ""}`);
};

export const resolveAnomaly = async (anomalyId) =>
  api.patch(`/review/anomalies/${anomalyId}/resolve`);
