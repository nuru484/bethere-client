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
        // Release id injected at build time by @sentry/vite-plugin (the
        // commit SHA on Vercel). Ties events to the deploy that produced
        // them and lets Sentry resolve the uploaded source maps.
        release:
          typeof window !== "undefined" && window.SENTRY_RELEASE?.id
            ? window.SENTRY_RELEASE.id
            : undefined,
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
