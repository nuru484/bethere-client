import axios from "axios";
import encryptStorage from "@/lib/encryptedStorage";

class APIError extends Error {
  constructor(message, status, type, details = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

const serverURL = import.meta.env.VITE_SERVER_URL;

const api = axios.create({
  baseURL: `${serverURL}/api/v1`,
  timeout: 3 * 60 * 1000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = encryptStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh: all concurrent 401s share one in-flight refresh
// request so token rotation does not invalidate sibling refresh attempts.
let refreshPromise = null;

const refreshTokens = async () => {
  const refreshToken = encryptStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Server envelope: { message, data: { accessToken, refreshToken } }
  const { data: body } = await axios.post(
    `${serverURL}/api/v1/refreshToken`,
    {},
    {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );

  const { accessToken, refreshToken: rotatedRefreshToken } = body.data;

  encryptStorage.setItem("accessToken", accessToken);
  encryptStorage.setItem("refreshToken", rotatedRefreshToken);

  return accessToken;
};

// Response interceptor for token refresh
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
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (err) {
        console.error("Token refresh failed", err);
        encryptStorage.removeItem("accessToken");
        encryptStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
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

export { api, APIError };
