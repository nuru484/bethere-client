// src/api/attendance.js
import { api } from ".";
import { buildSearchParams } from "./users";

// Step 1 of check-in/check-out: prove presence with the scanned venue code and
// request a liveness challenge. `mode` is "in" or "out". The server returns the
// actions the user must perform and a single-use challengeToken.
export const createAttendanceChallenge = async (eventId, { venueCode, mode }) =>
  api.post(`/attendance/${eventId}/challenge`, { venueCode, mode });

// Step 2 of check-in: upload the captured frames. `formData` is a FormData
// instance (challengeToken + `frames` files); passing it straight through lets
// axios set the multipart boundary itself - do NOT hand-set Content-Type here.
export const createAttendance = async (eventId, formData) =>
  api.post(`/attendance/${eventId}`, formData);

// Step 2 of check-out: same multipart shape as check-in (challengeToken +
// `frames`), sent as a PUT. Pass the FormData straight through so axios keeps
// the multipart boundary - do NOT hand-set Content-Type here.
export const updateAttendance = async (eventId, formData) =>
  api.put(`/attendance/${eventId}`, formData);

export const getUserAttendance = async (userId, params = {}) => {
  const queryString = buildSearchParams(params);

  const url = `/attendance/users/${userId}${
    queryString ? `?${queryString}` : ""
  }`;

  return await api.get(url);
};

export const getEventAttendance = async (eventId, params = {}) => {
  const queryString = buildSearchParams(params);

  const url = `/attendance/events/${eventId}${
    queryString ? `?${queryString}` : ""
  }`;

  return await api.get(url);
};

export const getUserEventAttendance = async (userId, eventId, params = {}) => {
  const queryString = buildSearchParams(params);

  const url = `attendance/users/${userId}/events/${eventId}${
    queryString ? `?${queryString}` : ""
  }`;

  return await api.get(url);
};
