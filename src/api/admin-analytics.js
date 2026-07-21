// src/api/admin-analytics.js
//
// The redesigned admin analytics slices. Each function maps 1:1 to a
// /dashboard/admin/* endpoint; the axios interceptor unwraps the response to
// the server envelope { message, data }.
import { api } from ".";
import { buildSearchParams } from "./users";

const withParams = (path, params = {}) => {
  const queryString = buildSearchParams(params);
  return api.get(`${path}${queryString ? `?${queryString}` : ""}`);
};

export const getAdminLiveSnapshot = async () => api.get("/dashboard/admin/live");

export const getAdminKpis = async (params = {}) =>
  withParams("/dashboard/admin/kpis", params);

export const getPresenceTrend = async (params = {}) =>
  withParams("/dashboard/admin/presence-trend", params);

export const getPresenceBreakdown = async (params = {}) =>
  withParams("/dashboard/admin/presence-breakdown", params);

export const getPunctualityTrend = async (params = {}) =>
  withParams("/dashboard/admin/punctuality-trend", params);

export const getLatenessDistribution = async (params = {}) =>
  withParams("/dashboard/admin/lateness-distribution", params);

export const getArrivalHeatmap = async (params = {}) =>
  withParams("/dashboard/admin/arrival-heatmap", params);

export const getAnomalyTrend = async (params = {}) =>
  withParams("/dashboard/admin/anomaly-trend", params);

export const getAnomalyBreakdown = async (params = {}) =>
  withParams("/dashboard/admin/anomaly-breakdown", params);

export const getLivenessQuality = async (params = {}) =>
  withParams("/dashboard/admin/liveness-quality", params);

export const getIntegritySummary = async (params = {}) =>
  withParams("/dashboard/admin/integrity-summary", params);

export const getTopAttendees = async (params = {}) =>
  withParams("/dashboard/admin/top-attendees", params);

export const getRetentionCurve = async (params = {}) =>
  withParams("/dashboard/admin/retention-curve", params);

export const generateAiSummary = async (params = {}) =>
  api.post("/dashboard/admin/ai-summary", params);
