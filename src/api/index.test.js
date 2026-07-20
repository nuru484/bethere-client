// src/api/index.test.js
//
// Exercises the response interceptor by driving the REAL `api` instance
// through a mocked axios adapter, so refresh handling and error
// normalization are tested composed - exactly as they run in production.
// (The old suite invoked each interceptor's handler in isolation, which
// hid composition bugs: fabricated rejections being re-normalized into
// "An unexpected error occurred", and retries that skipped teardown.)
// Auth is cookie-only: nothing is persisted client-side, the refresh POST
// simply rides the httpOnly refresh cookie and the original request is
// retried once the server has re-set the auth cookies.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosError, CanceledError } from "axios";
import { api, ApiError } from "@/api/index";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { AUTHED_FLAG } from "@/lib/auth-flag";

// ---- adapter helpers -------------------------------------------------------

const okResponse = (config, body) =>
  Promise.resolve({
    data: body,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

const httpError = (config, status, body) =>
  Promise.reject(
    new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, {}, {
      data: body,
      status,
      statusText: "",
      headers: {},
      config,
    })
  );

const expiredBody = {
  status: "error",
  message: "Access token expired.",
  code: "TOKEN_EXPIRED",
};

const adapter = vi.fn();

describe("api response interceptor (composed chain)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    adapter.mockReset();
    api.defaults.adapter = adapter;
    localStorage.setItem(AUTHED_FLAG, "1");
    // The teardown path calls window.location.assign("/login"); jsdom makes
    // location unforgeable, so the navigation just logs a jsdom "Not
    // implemented" notice rather than being spied on here.
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("unwraps response.data on success", async () => {
    adapter.mockImplementation((config) =>
      okResponse(config, { message: "ok", data: { id: 7 } })
    );

    await expect(api.get("/users/7")).resolves.toEqual({
      message: "ok",
      data: { id: 7 },
    });
  });

  describe("session refresh", () => {
    it("refreshes via the cookie endpoint and retries the original request", async () => {
      const postSpy = vi
        .spyOn(axios, "post")
        .mockResolvedValue({ data: { message: "Token refreshed" } });

      adapter.mockImplementation((config) =>
        config._retry
          ? okResponse(config, { data: "retried-response" })
          : httpError(config, 401, expiredBody)
      );

      const result = await api.get("/users");

      // Refresh call carries no payload or header: the httpOnly refresh
      // cookie travels via withCredentials.
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining("/refreshToken"),
        {},
        { withCredentials: true }
      );

      // The retry went through the api instance, so its response was
      // unwrapped by the same interceptor - not double-unwrapped.
      expect(result).toEqual({ data: "retried-response" });
      expect(adapter).toHaveBeenCalledTimes(2);
      expect(adapter.mock.calls[1][0]._retry).toBe(true);

      // The presence hint is untouched by a successful refresh.
      expect(localStorage.getItem(AUTHED_FLAG)).not.toBeNull();
    });

    it("shares one in-flight refresh across concurrent 401s", async () => {
      const postSpy = vi
        .spyOn(axios, "post")
        .mockResolvedValue({ data: { message: "Token refreshed" } });

      adapter.mockImplementation((config) =>
        config._retry
          ? okResponse(config, { data: config.url })
          : httpError(config, 401, expiredBody)
      );

      await Promise.all([api.get("/a"), api.get("/b")]);

      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it("rejects with the session-expired ApiError when refresh fails", async () => {
      vi.spyOn(axios, "post").mockRejectedValue(
        new AxiosError("Request failed", "ERR_BAD_REQUEST", {}, {}, {
          status: 401,
          data: { code: "TOKEN_EXPIRED" },
        })
      );

      adapter.mockImplementation((config) =>
        httpError(config, 401, expiredBody)
      );

      let caught;
      await api.get("/users").catch((err) => {
        caught = err;
      });

      // The fabricated rejection survives to callers intact - it used to be
      // mangled into "An unexpected error occurred" by the second
      // interceptor's normalizer.
      expect(caught).toBeInstanceOf(ApiError);
      expect(caught).toBeInstanceOf(Error);
      expect(caught).toMatchObject({
        status: 401,
        data: {
          status: "error",
          message: "Session expired. Please log in again.",
          code: "AUTH_ERROR",
        },
      });
      expect(extractApiErrorMessage(caught).message).toBe(
        "Session expired. Please log in again."
      );

      expect(localStorage.getItem(AUTHED_FLAG)).toBeNull();
    });

    it("tears the session down when the retry 401s again", async () => {
      const postSpy = vi
        .spyOn(axios, "post")
        .mockResolvedValue({ data: { message: "Token refreshed" } });

      // Refresh succeeds, but the server still rejects the retried request
      // (e.g. the token epoch was bumped between refresh and retry).
      adapter.mockImplementation((config) =>
        config._retry
          ? httpError(config, 401, {
              status: "error",
              message: "Invalid token",
              code: "INVALID_TOKEN",
            })
          : httpError(config, 401, expiredBody)
      );

      await expect(api.get("/users")).rejects.toMatchObject({
        status: 401,
        data: { code: "INVALID_TOKEN" },
      });

      // One refresh only (_retry blocks a second), and the zombie session
      // is torn down - this path used to bypass teardown entirely because
      // the retry went through bare axios with no interceptors.
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(AUTHED_FLAG)).toBeNull();
    });

    it("does not attempt a refresh for other auth error codes, and ends the session", async () => {
      const postSpy = vi.spyOn(axios, "post");

      adapter.mockImplementation((config) =>
        httpError(config, 401, {
          status: "error",
          message: "Invalid token",
          code: "INVALID_TOKEN",
        })
      );

      await expect(api.get("/users")).rejects.toMatchObject({
        status: 401,
        data: { code: "INVALID_TOKEN" },
      });
      expect(postSpy).not.toHaveBeenCalled();
      expect(localStorage.getItem(AUTHED_FLAG)).toBeNull();
    });

    it("never tears down the session for a failed login", async () => {
      // The server answers bad credentials with 401 INVALID_CREDENTIALS.
      // That belongs to the form, not the session: no flag clear, no
      // redirect, and the message must reach the form intact.
      adapter.mockImplementation((config) =>
        httpError(config, 401, {
          status: "error",
          message: "Invalid Credentials",
          code: "INVALID_CREDENTIALS",
        })
      );

      let caught;
      await api.post("/auth/login", {}).catch((err) => {
        caught = err;
      });

      expect(caught).toMatchObject({
        status: 401,
        data: { message: "Invalid Credentials", code: "INVALID_CREDENTIALS" },
      });
      expect(extractApiErrorMessage(caught).message).toBe(
        "Invalid Credentials"
      );
      expect(localStorage.getItem(AUTHED_FLAG)).not.toBeNull();
    });

    it("leaves the anonymous boot probe alone", async () => {
      // No presence hint = nobody was signed in: nothing to tear down and
      // no navigation to hijack for the /auth/me probe on public pages.
      localStorage.removeItem(AUTHED_FLAG);

      adapter.mockImplementation((config) =>
        httpError(config, 401, {
          status: "error",
          message: "Authentication required",
          code: "NO_TOKEN",
        })
      );

      await expect(api.get("/auth/me")).rejects.toMatchObject({
        status: 401,
        data: { code: "NO_TOKEN" },
      });
      expect(localStorage.getItem(AUTHED_FLAG)).toBeNull();
    });
  });

  describe("error normalization", () => {
    it("rejects with an ApiError that is a real Error", async () => {
      adapter.mockImplementation((config) =>
        httpError(config, 404, {
          status: "error",
          message: "Event not found",
          requestId: "req_1",
        })
      );

      let caught;
      await api.get("/events/9").catch((err) => {
        caught = err;
      });

      expect(caught).toBeInstanceOf(Error);
      expect(caught.name).toBe("ApiError");
      expect(caught.message).toBe("Event not found");
      expect(typeof caught.stack).toBe("string");
      expect(caught).toMatchObject({
        status: 404,
        data: {
          status: "error",
          message: "Event not found",
          code: "UNKNOWN_ERROR",
        },
      });
    });

    it("passes the machine-readable code and dev errorId through", async () => {
      adapter.mockImplementation((config) =>
        httpError(config, 409, {
          status: "error",
          message: "An account with this email already exists",
          code: "DUPLICATE_RECORD",
          errorId: "err_abc_123",
        })
      );

      await expect(api.post("/users", {})).rejects.toMatchObject({
        status: 409,
        data: { code: "DUPLICATE_RECORD", errorId: "err_abc_123" },
      });
    });

    it("forwards the validation field-error shape (details.errors)", async () => {
      const fieldErrors = [
        { field: "email", message: "Email must be valid" },
        { field: "firstName", message: "First name is required" },
      ];

      adapter.mockImplementation((config) =>
        httpError(config, 400, {
          status: "error",
          message: "Validation Error",
          code: "VALIDATION_ERROR",
          details: { errors: fieldErrors },
        })
      );

      let caught;
      await api.post("/users", {}).catch((err) => {
        caught = err;
      });

      expect(caught).toMatchObject({
        status: 400,
        data: { code: "VALIDATION_ERROR", details: { errors: fieldErrors } },
      });
      expect(extractApiErrorMessage(caught)).toMatchObject({
        hasFieldErrors: true,
        fieldErrors: {
          email: "Email must be valid",
          firstName: "First name is required",
        },
      });
    });

    it("survives a response with no usable body", async () => {
      // Gateways answer 502 with a JSON `null` body; reading .message off it
      // used to throw a TypeError from inside the handler.
      adapter.mockImplementation((config) => httpError(config, 502, null));

      await expect(api.get("/users")).rejects.toMatchObject({
        status: 502,
        data: { message: "An error occurred", code: "UNKNOWN_ERROR" },
      });
    });

    it("survives an HTML gateway body", async () => {
      adapter.mockImplementation((config) =>
        httpError(config, 502, "<html>Bad Gateway</html>")
      );

      await expect(api.get("/users")).rejects.toMatchObject({
        status: 502,
        data: { message: "An error occurred", code: "UNKNOWN_ERROR" },
      });
    });

    it("classifies a timeout as TIMEOUT_ERROR even with a populated request", async () => {
      // Real axios timeouts carry error.request; the old branch order
      // checked error.request first, which made TIMEOUT_ERROR unreachable
      // and told users the server was unreachable instead.
      adapter.mockImplementation((config) =>
        Promise.reject(
          new AxiosError(
            "timeout of 180000ms exceeded",
            "ECONNABORTED",
            config,
            {}
          )
        )
      );

      let caught;
      await api.get("/users").catch((err) => {
        caught = err;
      });

      expect(caught).toMatchObject({ status: "TIMEOUT_ERROR" });
      expect(extractApiErrorMessage(caught).message).toBe("Request timed out");
    });

    it("classifies a cancellation as CANCELLED", async () => {
      adapter.mockImplementation(() =>
        Promise.reject(new CanceledError("canceled"))
      );

      await expect(api.get("/users")).rejects.toMatchObject({
        status: "CANCELLED",
        error: "Request was cancelled",
      });
    });

    it("maps a request with no response to FETCH_ERROR", async () => {
      adapter.mockImplementation((config) =>
        Promise.reject(
          new AxiosError("Network Error", "ERR_NETWORK", config, {})
        )
      );

      await expect(api.get("/users")).rejects.toMatchObject({
        status: "FETCH_ERROR",
        error: "Network error - unable to connect to server",
        data: null,
      });
    });

    it("maps anything else to UNKNOWN_ERROR with the original message", async () => {
      adapter.mockImplementation(() => Promise.reject(new Error("boom")));

      await expect(api.get("/users")).rejects.toMatchObject({
        status: "UNKNOWN_ERROR",
        error: "boom",
      });
    });
  });
});
