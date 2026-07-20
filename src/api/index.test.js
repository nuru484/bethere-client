// src/api/index.test.js
//
// Exercises the session-refresh response interceptor in isolation by
// invoking its rejected handler directly with a fabricated 401. Auth is
// cookie-only: nothing is persisted client-side, the refresh POST simply
// rides the httpOnly refresh cookie and the original request is retried
// once the server has re-set the auth cookies. The axios module is mocked
// so the bare `axios.post` refresh call and the `axios(config)` retry
// never hit the network, while `axios.create` stays real so the
// interceptor chain on the `api` instance is wired exactly as in
// production.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal();
  const mockAxios = vi.fn();
  mockAxios.post = vi.fn();
  mockAxios.create = (...args) => actual.default.create(...args);
  return { default: mockAxios };
});

import axios from "axios";
import { api } from "@/api/index";

// First response interceptor registered in src/api/index.js is the refresh
// interceptor; grab its rejected handler so it can be driven directly.
const refreshRejectedHandler = api.interceptors.response.handlers[0].rejected;

const expiredError = (config = { headers: {} }) => ({
  config,
  response: {
    status: 401,
    data: {
      status: "error",
      message: "Access token expired.",
      code: "TOKEN_EXPIRED",
    },
  },
});

describe("refresh interceptor (cookie flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("bethere.authed", "1");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("refreshes via the cookie endpoint and retries the original request", async () => {
    axios.post.mockResolvedValue({
      data: {
        message: "Token refreshed",
        data: { user: { id: 1, role: "ADMIN" } },
      },
    });
    axios.mockResolvedValue({ data: "retried-response" });

    const originalRequest = { url: "/users", headers: {} };
    const result = await refreshRejectedHandler(expiredError(originalRequest));

    // Refresh call carries no payload or header: the httpOnly refresh
    // cookie travels via withCredentials.
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/refreshToken"),
      {},
      { withCredentials: true }
    );

    // Nothing is persisted client-side; the retry has no Authorization
    // header because the new cookies are already set by the server.
    expect(originalRequest.headers.Authorization).toBeUndefined();
    expect(axios).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: "retried-response" });

    // The persisted user is untouched by a successful refresh.
    expect(localStorage.getItem("bethere.authed")).not.toBeNull();
  });

  it("shares one in-flight refresh across concurrent 401s", async () => {
    axios.post.mockResolvedValue({
      data: {
        message: "Token refreshed",
        data: { user: { id: 1, role: "ADMIN" } },
      },
    });
    axios.mockResolvedValue({ data: "retried-response" });

    await Promise.all([
      refreshRejectedHandler(expiredError({ url: "/a", headers: {} })),
      refreshRejectedHandler(expiredError({ url: "/b", headers: {} })),
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("clears the persisted user when refresh fails", async () => {
    // Note: the handler also calls window.location.assign("/login"); jsdom
    // makes location unforgeable so the navigation itself is not spied on
    // here - it just logs a jsdom "Not implemented: navigation" notice.
    axios.post.mockRejectedValue({
      response: { status: 401, data: { code: "TOKEN_EXPIRED" } },
    });

    await expect(
      refreshRejectedHandler(expiredError({ url: "/users", headers: {} }))
    ).rejects.toMatchObject({
      status: 401,
      data: { code: "AUTH_ERROR" },
    });

    expect(localStorage.getItem("bethere.authed")).toBeNull();
  });

  it("does not attempt a refresh for other auth error codes", async () => {
    const error = {
      config: { headers: {} },
      response: {
        status: 401,
        data: {
          status: "error",
          message: "Invalid token",
          code: "INVALID_TOKEN",
        },
      },
    };

    await expect(refreshRejectedHandler(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("does not retry a request that has already been retried", async () => {
    const error = expiredError({ url: "/users", headers: {}, _retry: true });

    await expect(refreshRejectedHandler(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
