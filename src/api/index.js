import axios from "axios";

const serverURL = import.meta.env.VITE_SERVER_URL;

// Auth is cookie-only: httpOnly cookies carry the tokens, so every request
// just needs credentials enabled - no Authorization header, no token reads.
const api = axios.create({
  baseURL: `${serverURL}/api/v1`,
  timeout: 3 * 60 * 1000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Single-flight refresh: all concurrent 401s share one in-flight refresh
// request so cookie rotation does not invalidate sibling refresh attempts.
let refreshPromise = null;

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

// Response interceptor for session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
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

        return axios(originalRequest);
      } catch (err) {
        console.error("Session refresh failed", err);
        // Clear the non-sensitive presence hint so the app boots logged-out.
        localStorage.removeItem("bethere.authed");
        window.location.assign("/login");
        return Promise.reject({
          status: 401,
          data: {
            status: "error",
            message: "Session expired. Please log in again.",
            code: "AUTH_ERROR",
          },
        });
      }
    }

    return Promise.reject(error);
  }
);

// Main error handling interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    // Structure the error in a format compatible with extractApiErrorMessage
    const standardizedError = {
      status: error.response?.status || 0,
      data: null,
    };

    if (error.response) {
      // Server responded with an error
      const { data } = error.response;

      standardizedError.data = {
        status: "error",
        message: data.message || "An error occurred",
        code: data.code || "UNKNOWN_ERROR",
      };

      // Add errorId if present
      if (data.errorId) {
        standardizedError.data.errorId = data.errorId;
      }

      if (data.details && typeof data.details === "object") {
        // Check if details contains an errors array
        if (Array.isArray(data.details.errors)) {
          standardizedError.data.details = {
            errors: data.details.errors,
          };
        }
        // Check if details contains fieldErrors object
        else if (
          data.details.fieldErrors &&
          typeof data.details.fieldErrors === "object"
        ) {
          standardizedError.data.details = {
            fieldErrors: data.details.fieldErrors,
          };
        } else if (Object.keys(data.details).length > 0) {
          standardizedError.data.details = {
            fieldErrors: data.details,
          };
        }
      }

      // Handle field errors in various formats at root level
      if (data.errors && Array.isArray(data.errors)) {
        // Check if errors are field-level errors
        const hasFieldErrors = data.errors.some(
          (err) => err && typeof err === "object" && "field" in err
        );

        if (hasFieldErrors) {
          if (!standardizedError.data.details) {
            standardizedError.data.details = {};
          }
          standardizedError.data.details.errors = data.errors;
        } else {
          // Non-field errors (general error messages)
          const errorMessages = data.errors
            .map((err) => err.message || String(err))
            .filter(Boolean);

          if (errorMessages.length > 0) {
            standardizedError.data.message = errorMessages.join(", ");
          }
        }
      }

      // Handle direct fieldErrors object
      if (data.fieldErrors && typeof data.fieldErrors === "object") {
        if (!standardizedError.data.details) {
          standardizedError.data.details = {};
        }
        standardizedError.data.details.fieldErrors = data.fieldErrors;
      }

      // Handle direct errors object
      if (
        data.errors &&
        typeof data.errors === "object" &&
        !Array.isArray(data.errors)
      ) {
        standardizedError.data.errors = data.errors;
      }
    } else if (error.request) {
      // Request was made but no response received
      standardizedError.status = "FETCH_ERROR";
      standardizedError.error = "Network error - unable to connect to server";
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      // Timeout error
      standardizedError.status = "TIMEOUT_ERROR";
    } else if (error.message === "canceled") {
      // Request was cancelled
      standardizedError.status = "CANCELLED";
      standardizedError.error = "Request was cancelled";
    } else {
      // Something else happened
      standardizedError.status = "UNKNOWN_ERROR";
      standardizedError.error = error.message || "An unexpected error occurred";
    }

    return Promise.reject(standardizedError);
  }
);

export { api };
