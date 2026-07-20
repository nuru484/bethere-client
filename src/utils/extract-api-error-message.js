// src/utils/extract-api-error-message.js

export const extractApiErrorMessage = (error) => {
  if (!error) {
    return { message: "An unknown error occurred", hasFieldErrors: false };
  }

  if (typeof error === "string") {
    return { message: error, hasFieldErrors: false };
  }

  if (typeof error === "object" && error !== null) {
    // Handle axios/network-specific errors
    if (
      "status" in error &&
      error.status === "FETCH_ERROR" &&
      "error" in error
    ) {
      const errorMessage =
        typeof error.error === "string"
          ? error.error
          : "Network error - unable to connect to server";
      return { message: errorMessage, hasFieldErrors: false };
    }

    if (
      "status" in error &&
      error.status === "PARSING_ERROR" &&
      "error" in error
    ) {
      return {
        message: "Failed to parse server response",
        hasFieldErrors: false,
      };
    }

    if ("status" in error && error.status === "TIMEOUT_ERROR") {
      return { message: "Request timed out", hasFieldErrors: false };
    }

    if ("status" in error && error.status === "CANCELLED") {
      return { message: "Request was cancelled", hasFieldErrors: false };
    }

    // Main error handling for API responses
    if ("status" in error && "data" in error) {
      const { data } = error;

      if (typeof data === "string") {
        return { message: data, hasFieldErrors: false };
      }

      if (data && typeof data === "object") {
        if ("status" in data && data.status === "error") {
          const result = {
            message:
              "message" in data && typeof data.message === "string"
                ? data.message
                : "An error occurred",
            hasFieldErrors: false,
          };

          // Add errorId and code if present
          if ("errorId" in data && typeof data.errorId === "string") {
            result.errorId = data.errorId;
          }
          if ("code" in data && typeof data.code === "string") {
            result.code = data.code;
          }

          // Handle field errors in details.errors array format
          if (
            "details" in data &&
            data.details &&
            typeof data.details === "object" &&
            "errors" in data.details &&
            Array.isArray(data.details.errors)
          ) {
            const fieldErrors = {};

            data.details.errors.forEach((err) => {
              if (
                err &&
                typeof err === "object" &&
                "field" in err &&
                "message" in err &&
                typeof err.field === "string" &&
                typeof err.message === "string"
              ) {
                if (!fieldErrors[err.field]) {
                  fieldErrors[err.field] = [];
                }
                fieldErrors[err.field].push(err.message);
              }
            });

            if (Object.keys(fieldErrors).length > 0) {
              const formattedFieldErrors = {};
              Object.entries(fieldErrors).forEach(([field, messages]) => {
                formattedFieldErrors[field] = messages[0];
              });

              result.fieldErrors = formattedFieldErrors;
              result.hasFieldErrors = true;
            }
          }

          // Handle field errors in details.fieldErrors object format
          if (
            "details" in data &&
            data.details &&
            typeof data.details === "object" &&
            "fieldErrors" in data.details &&
            typeof data.details.fieldErrors === "object" &&
            data.details.fieldErrors !== null
          ) {
            const fieldErrors = {};
            let hasValidFieldErrors = false;

            Object.entries(data.details.fieldErrors).forEach(
              ([field, messages]) => {
                if (Array.isArray(messages) && messages.length > 0) {
                  fieldErrors[field] = messages[0];
                  hasValidFieldErrors = true;
                } else if (typeof messages === "string") {
                  fieldErrors[field] = messages;
                  hasValidFieldErrors = true;
                }
              }
            );

            if (hasValidFieldErrors) {
              result.fieldErrors = fieldErrors;
              result.hasFieldErrors = true;
            }
          }

          return result;
        }

        // Handle errors object at root level (Laravel-style validation)
        if (
          "errors" in data &&
          typeof data.errors === "object" &&
          data.errors !== null
        ) {
          const fieldErrors = {};
          let hasValidFieldErrors = false;

          Object.entries(data.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[field] = messages[0];
              hasValidFieldErrors = true;
            } else if (typeof messages === "string") {
              fieldErrors[field] = messages;
              hasValidFieldErrors = true;
            }
          });

          if (hasValidFieldErrors) {
            const generalMessage =
              "message" in data && typeof data.message === "string"
                ? data.message
                : "Validation failed";

            return {
              message: generalMessage,
              fieldErrors,
              hasFieldErrors: true,
            };
          }
        }

        // Fallback message extraction
        if ("message" in data && typeof data.message === "string") {
          return { message: data.message, hasFieldErrors: false };
        }
        if ("error" in data && typeof data.error === "string") {
          return { message: data.error, hasFieldErrors: false };
        }

        // Handle errors array (non-field errors)
        if ("errors" in data && Array.isArray(data.errors)) {
          const message = data.errors
            .map((e) => e.message || String(e))
            .join(", ");
          return { message, hasFieldErrors: false };
        }
      }

      // HTTP status code messages
      if (typeof error.status === "number") {
        const statusMessages = {
          400: "Bad request",
          401: "Unauthorized - please log in",
          403: "Access forbidden",
          404: "Resource not found",
          500: "Internal server error",
          502: "Bad gateway",
          503: "Service unavailable",
        };

        const message =
          statusMessages[error.status] || `HTTP ${error.status} error`;
        return { message, hasFieldErrors: false };
      }
    }

    // Fallback message extraction from error object
    if ("message" in error && typeof error.message === "string") {
      return { message: error.message, hasFieldErrors: false };
    }

    if ("error" in error && typeof error.error === "string") {
      return { message: error.error, hasFieldErrors: false };
    }
  }

  try {
    const stringified = JSON.stringify(error);
    if (stringified && stringified !== "{}") {
      return { message: `Error: ${stringified}`, hasFieldErrors: false };
    }
  } catch {
    // ignore
  }

  return { message: "An unknown error occurred", hasFieldErrors: false };
};
