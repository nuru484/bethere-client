// src/lib/sentry.js
//
// Optional error tracking. Sentry is initialized ONLY when
// VITE_SENTRY_DSN is set, and the SDK is imported lazily so its bundle
// cost is skipped entirely otherwise (the dynamic import lands in its
// own async chunk that is never fetched without a DSN).
const dsn = import.meta.env.VITE_SENTRY_DSN;

let sentryPromise = null;

export const initSentry = () => {
  if (!dsn) return;

  sentryPromise = import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
      });
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
