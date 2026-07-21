// src/api/pairing.js
//
// Cross-device "scan from phone" hand-off. Two audiences:
//  - the LAPTOP (cookie-authenticated) starts a pairing and polls its status,
//    so those calls go through the shared `api` instance.
//  - the PHONE has no cookie; it carries the short-lived hand-off token from the
//    QR link as a Bearer credential, so those calls go through a SEPARATE axios
//    instance with no credentials and no cookie-refresh interceptor.
import axios from "axios";
import { api } from ".";

const serverURL = import.meta.env.VITE_SERVER_URL;

// Bearer-only client for the phone. No withCredentials (there is no session),
// and a tiny normalizer so failures match the { status, data } shape
// extractApiErrorMessage already reads.
const remote = axios.create({
  baseURL: `${serverURL}/api/v1`,
  timeout: 3 * 60 * 1000,
});

remote.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const body = error.response.data ?? {};
      return Promise.reject({
        status: error.response.status ?? 0,
        data: {
          status: "error",
          message: body.message || "An error occurred",
          code: body.code || "UNKNOWN_ERROR",
        },
      });
    }
    return Promise.reject({
      status: 0,
      data: { status: "error", message: "Network error. Check your connection." },
    });
  }
);

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// --- Laptop (cookie) ---

// Start a pairing. scope "ATTENDANCE" needs eventId + mode; "ENROLL" needs
// neither. Returns { pairingId, handoffToken, expiresAt }.
export const startPairing = async ({ scope, eventId, mode }) =>
  api.post(`/pairing`, { scope, eventId, mode });

// Poll whether the phone has finished. Returns { status, scope, completedAt }.
export const getPairingStatus = async (pairingId) =>
  api.get(`/pairing/${pairingId}`);

// --- Phone (Bearer hand-off token) ---

export const getPairingContext = async (token) =>
  remote.get(`/pairing/session/context`, authHeader(token));

export const remoteStepChallenge = async (token, { venueCode } = {}) =>
  remote.post(`/pairing/session/step-challenge`, { venueCode }, authHeader(token));

export const remoteStep = async (token, formData) =>
  remote.post(`/pairing/session/step`, formData, authHeader(token));
