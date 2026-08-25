// src/lib/sentry.test.js
//
// Sentry stays inert without a DSN, and when configured it never sends
// default PII and tags events with the build's release id.
import { afterEach, describe, expect, it, vi } from "vitest";

const loadFresh = async (env) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  return import("@/lib/sentry");
};

describe("sentry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does nothing without VITE_SENTRY_DSN", async () => {
    const { initSentry, reportError, sentryOptions } = await loadFresh({
      VITE_SENTRY_DSN: "",
    });

    initSentry();
    reportError(new Error("ignored"));

    expect(sentryOptions().enabled).toBe(false);
  });

  it("initialises with the DSN, the release and no default PII", async () => {
    const { sentryOptions } = await loadFresh({
      VITE_SENTRY_DSN: "https://key@sentry.example/1",
      VITE_SENTRY_RELEASE: "abc123",
    });

    expect(sentryOptions()).toMatchObject({
      dsn: "https://key@sentry.example/1",
      enabled: true,
      release: "abc123",
      sendDefaultPii: false,
    });
  });

  it("falls back to the release id injected by the source-map upload", async () => {
    window.SENTRY_RELEASE = { id: "from-plugin" };
    const { sentryOptions } = await loadFresh({
      VITE_SENTRY_DSN: "https://key@sentry.example/1",
      VITE_SENTRY_RELEASE: "",
    });

    expect(sentryOptions().release).toBe("from-plugin");
    delete window.SENTRY_RELEASE;
  });
});
