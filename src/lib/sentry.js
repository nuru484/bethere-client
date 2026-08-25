// src/lib/sentry.js
//
// Optional error tracking. Sentry is initialized ONLY when
// VITE_SENTRY_DSN is set, and the SDK is imported lazily so its bundle
// cost is skipped entirely otherwise (the dynamic import lands in its
// own async chunk that is never fetched without a DSN).
const dsn = import.meta.env.VITE_SENTRY_DSN;

let sentryPromise = null;

// The deploy this bundle came from, so events map to a commit and to the
// source maps uploaded for it. VITE_SENTRY_RELEASE is defined at build time
// from the Vercel commit SHA (see vite.config.js); window.SENTRY_RELEASE is
// the id @sentry/vite-plugin injects on a source-map upload. Undefined is
// fine: events still arrive, only unversioned.
const resolveRelease = () =>
  import.meta.env.VITE_SENTRY_RELEASE ||
  (typeof window !== "undefined" ? window.SENTRY_RELEASE?.id : undefined) ||
  undefined;

/**
 * Options handed to Sentry.init. Exported so the test can pin the privacy
 * settings without loading the SDK.
 */
export const sentryOptions = () => ({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.MODE,
  release: resolveRelease(),
  // No IP addresses or cookies on events: the request id in an error
  // response is enough to find the matching server log.
  sendDefaultPii: false,
});

export const initSentry = () => {
  if (!dsn) return;

  sentryPromise = import("@sentry/react")
    .then((Sentry) => {
      Sentry.init(sentryOptions());
      return Sentry;
    })
    .catch((error) => {
      console.error("Failed to initialize Sentry", error);
      return null;
    });
};

// Reports an error (with optional context) once the SDK is ready.
// No-ops when Sentry is disabled.
export const reportError = (error, context) => {
  if (!sentryPromise) return;

  sentryPromise.then((Sentry) => {
    if (!Sentry) return;
    Sentry.captureException(error, context ? { extra: context } : undefined);
  });
};
