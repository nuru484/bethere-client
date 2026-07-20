import axios from "axios";
// The non-sensitive presence hint AuthContext keeps. Only a session that
// believed it was signed in gets torn down and bounced to /login.
import { AUTHED_FLAG } from "@/lib/auth-flag";

const serverURL = import.meta.env.VITE_SERVER_URL;

// Every rejection from this layer is an ApiError: a real Error (stack trace,
// clean Sentry grouping, `instanceof Error` works) that carries the exact
// plain shape consumers and extractApiErrorMessage already read:
// { status, data, error }.
class ApiError extends Error {
  constructor({ status, data = null, error }) {
    const message =
      (data && typeof data === "object" && data.message) ||
      (typeof error === "string" ? error : "Request failed");
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    if (error !== undefined) {
      this.error = error;
    }
  }
}

// Auth is cookie-only: httpOnly cookies carry the tokens, so every request
// just needs credentials enabled - no Authorization header, no token reads.
// No default Content-Type on purpose. Axios already sets application/json for
// plain-object bodies, but a hard-coded JSON default also applies to FormData -
// and axios then serializes the FormData to JSON (files become {}), silently
// breaking every multipart upload. Letting axios infer keeps JSON bodies JSON
// and lets the browser set multipart/form-data with its boundary.
const api = axios.create({
  baseURL: `${serverURL}/api/v1`,
  timeout: 3 * 60 * 1000,
  withCredentials: true,
});

// Single-flight refresh: all concurrent 401s share one in-flight refresh
// request so cookie rotation does not invalidate sibling refresh attempts.
let refreshPromise = null;

// The boot probe legitimately 401s for anonymous visitors on public pages.
// AuthContext already renders those logged-out and ProtectedRoutes sends them
// to /login itself, so never hijack navigation for it.
const isSessionProbe = (config) => Boolean(config?.url?.includes("/auth/me"));

// A login failure is a 401 too (INVALID_CREDENTIALS), but it is an answer to
// the form, not a dead session - it must never clear the flag or redirect.
const isLoginRequest = (config) =>
  Boolean(config?.url?.includes("/auth/login"));

const endSession = (config) => {
  const wasAuthed = localStorage.getItem(AUTHED_FLAG) !== null;
  // Clear the presence hint so the app boots logged-out.
  localStorage.removeItem(AUTHED_FLAG);

  if (wasAuthed && !isSessionProbe(config)) {
    window.location.assign("/login");
  }
};

// The refresh cookie travels automatically; the server rotates both auth
// cookies and responds { message, data: { user } }. Nothing to persist
// client-side - the retry succeeds because the new cookies are already set.
const refreshSession = async () => {
  await axios.post(
    `${serverURL}/api/v1/refreshToken`,
    {},
    { withCredentials: true }
  );
};

// Turns any axios rejection into the ApiError shape extractApiErrorMessage
// understands. Branch order matters: timeouts and cancellations both carry a
// populated error.request in the browser adapter, so they must be classified
// BEFORE the generic no-response network branch or they become unreachable
// and surface as "unable to connect".
const normalizeError = (error) => {
  if (error.response) {
    // Server responded with an error. The envelope is fixed (see the
    // server's error-handler.js): { status, message, requestId, code?,
    // errorId? (dev), details? } - details only ever carries the
    // validation middleware's { errors: [{ field, message }] }. But the
    // body is not always an object: a gateway can answer 502 with a JSON
    // `null` (or an HTML string), and reading `.message` off that used to
    // throw inside this handler and surface "Cannot read properties of
    // null" to the user.
    const body = error.response.data ?? {};
    const data = {
      status: "error",
      message: body.message || "An error occurred",
      code: body.code || "UNKNOWN_ERROR",
    };

    // errorId is only present on non-production envelopes.
    if (body.errorId) {
      data.errorId = body.errorId;
    }

    // The only field-error shape the server produces: VALIDATION_ERROR
    // context forwarded as details.errors. extractApiErrorMessage turns it
    // into per-field form errors.
    if (body.details && Array.isArray(body.details.errors)) {
      data.details = { errors: body.details.errors };
    }

    return new ApiError({ status: error.response.status || 0, data });
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return new ApiError({ status: "TIMEOUT_ERROR", error: "Request timed out" });
  }

  if (axios.isCancel(error) || error.message === "canceled") {
    return new ApiError({
      status: "CANCELLED",
      error: "Request was cancelled",
    });
  }

  if (error.request) {
    return new ApiError({
      status: "FETCH_ERROR",
      error: "Network error - unable to connect to server",
    });
  }

  return new ApiError({
    status: "UNKNOWN_ERROR",
    error: error.message || "An unexpected error occurred",
  });
};

// One interceptor handles refresh AND normalization. They used to be two
// stacked interceptors, which had a composition bug class: rejections
// fabricated by the refresh layer were re-normalized into "An unexpected
// error occurred" by the layer below it, and a retry issued through bare
// axios skipped the teardown path entirely. A single handler means every
// rejection is normalized exactly once and the retry re-enters the full
// chain by going through `api` itself.
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // A rejection that is already normalized came from a nested retry's own
    // pass through this interceptor - propagate untouched.
    if (error instanceof ApiError) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshSession().finally(() => {
            refreshPromise = null;
          });
        }

        await refreshPromise;

        // Retry through the api instance (not bare axios) so this
        // interceptor runs again: the response is unwrapped the same way,
        // and a retry that STILL 401s falls into the teardown branch below
        // on its own pass (_retry blocks a second refresh attempt).
        return api(originalRequest);
      } catch {
        // The refresh itself failed: the session is over.
        endSession(originalRequest);
        return Promise.reject(
          new ApiError({
            status: 401,
            data: {
              status: "error",
              message: "Session expired. Please log in again.",
              code: "AUTH_ERROR",
            },
          })
        );
      }
    }

    // Any other 401 is not refreshable: the session was revoked, the token
    // epoch was bumped, the cookie is invalid, or a retry 401'd again. Doing
    // nothing left a zombie session - AuthContext only probes on mount, so
    // `user` stayed populated, ProtectedRoutes kept rendering, and every panel
    // errored with no way out. Tear it down like a failed refresh does.
    // Login failures are exempt: they belong to the form, not the session.
    if (error.response?.status === 401 && !isLoginRequest(originalRequest)) {
      endSession(originalRequest);
    }

    return Promise.reject(normalizeError(error));
  }
);

export { api, ApiError };
