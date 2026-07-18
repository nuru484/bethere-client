// src/api/index.test.js
//
// Exercises the token-refresh response interceptor in isolation by invoking
// its rejected handler directly with a fabricated 401. The axios module is
// mocked so the bare `axios.post` refresh call and the `axios(config)` retry
// never hit the network, while `axios.create` stays real so the interceptor
// chain on the `api` instance is wired exactly as in production.
import { describe, it, expect, vi, beforeEach } from "vitest";

const { storage } = vi.hoisted(() => ({ storage: new Map() }));

vi.mock("@/lib/encryptedStorage", () => ({
  default: {
    getItem: (key) => storage.get(key),
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
}));

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
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    },
  },
});

describe("refresh interceptor", () => {
  beforeEach(() => {
    storage.clear();
    storage.set("accessToken", "old-access");
    storage.set("refreshToken", "old-refresh");
    vi.clearAllMocks();
  });

  it("reads the new { message, data: { accessToken, refreshToken } } envelope and retries", async () => {
    axios.post.mockResolvedValue({
      data: {
        message: "Token refreshed",
        data: {
          accessToken: "new-access",
          refreshToken: "new-refresh",
        },
      },
    });
    axios.mockResolvedValue({ data: "retried-response" });

    const originalRequest = { url: "/users", headers: {} };
    const result = await refreshRejectedHandler(expiredError(originalRequest));

    // Refresh call carried the old refresh token as the Bearer credential.
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/refreshToken"),
      {},
      { headers: { Authorization: "Bearer old-refresh" } }
    );

    // Rotated tokens were persisted from body.data (not newAccessToken/
    // newRefreshToken at the top level).
    expect(storage.get("accessToken")).toBe("new-access");
    expect(storage.get("refreshToken")).toBe("new-refresh");

    // The original request was retried with the new access token.
    expect(originalRequest.headers.Authorization).toBe("Bearer new-access");
    expect(axios).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: "retried-response" });
  });

  it("shares one in-flight refresh across concurrent 401s", async () => {
    axios.post.mockResolvedValue({
      data: {
        message: "Token refreshed",
        data: { accessToken: "new-access", refreshToken: "new-refresh" },
      },
    });
    axios.mockResolvedValue({ data: "retried-response" });

    await Promise.all([
      refreshRejectedHandler(expiredError({ url: "/a", headers: {} })),
      refreshRejectedHandler(expiredError({ url: "/b", headers: {} })),
    ]);

    expect(axios.post).toHaveBeenCalledTimes(1);
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
});
