// src/api/user-analytics.js
//
// The attendant's personal analytics slices. Each maps 1:1 to a
// /dashboard/users/* endpoint, scoped server-side to the signed-in user.
import { api } from ".";
import { buildSearchParams } from "./users";

const withParams = (path, params = {}) => {
  const queryString = buildSearchParams(params);
  return api.get(`${path}${queryString ? `?${queryString}` : ""}`);
};

export const getUserNowNext = async () => api.get("/dashboard/users/now-next");

export const getUserKpis = async (params = {}) =>
  withParams("/dashboard/users/kpis", params);

export const getUserAttendanceTrend = async (params = {}) =>
  withParams("/dashboard/users/attendance-trend", params);

export const getUserStatusBreakdown = async (params = {}) =>
  withParams("/dashboard/users/status-breakdown", params);

export const getUserEventBreakdown = async (params = {}) =>
  withParams("/dashboard/users/event-breakdown", params);

export const getUserCalendar = async (params = {}) =>
  withParams("/dashboard/users/calendar", params);
