import { describe, it, expect } from "vitest";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

describe("extractApiErrorMessage", () => {
  it("handles network (FETCH_ERROR) errors", () => {
    const result = extractApiErrorMessage({
      status: "FETCH_ERROR",
      error: "Network error - unable to connect to server",
    });

    expect(result).toEqual({
      message: "Network error - unable to connect to server",
      hasFieldErrors: false,
    });
  });

  it("falls back to a generic network message when error is not a string", () => {
    const result = extractApiErrorMessage({
      status: "FETCH_ERROR",
      error: { some: "object" },
    });

    expect(result.message).toBe("Network error - unable to connect to server");
    expect(result.hasFieldErrors).toBe(false);
  });

  it("extracts the message from a server error envelope", () => {
    const result = extractApiErrorMessage({
      status: 401,
      data: {
        status: "error",
        message: "Face verification failed. Please try again.",
        type: "AUTH_ERROR",
      },
    });

    expect(result.message).toBe("Face verification failed. Please try again.");
    expect(result.hasFieldErrors).toBe(false);
  });

  it("maps a details.errors array to per-field errors", () => {
    const result = extractApiErrorMessage({
      status: 400,
      data: {
        status: "error",
        message: "Validation failed",
        details: {
          errors: [
            { field: "email", message: "Email is required" },
            { field: "email", message: "Email must be valid" },
            { field: "password", message: "Password is too short" },
          ],
        },
      },
    });

    expect(result.hasFieldErrors).toBe(true);
    expect(result.message).toBe("Validation failed");
    // First message per field wins
    expect(result.fieldErrors).toEqual({
      email: "Email is required",
      password: "Password is too short",
    });
  });

  it("returns the unknown-error fallback for nullish input", () => {
    expect(extractApiErrorMessage(null)).toEqual({
      message: "An unknown error occurred",
      hasFieldErrors: false,
    });
    expect(extractApiErrorMessage(undefined)).toEqual({
      message: "An unknown error occurred",
      hasFieldErrors: false,
    });
  });

  it("returns the unknown-error fallback for an empty object", () => {
    expect(extractApiErrorMessage({})).toEqual({
      message: "An unknown error occurred",
      hasFieldErrors: false,
    });
  });
});
