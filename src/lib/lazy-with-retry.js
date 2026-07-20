// src/lib/lazy-with-retry.js
import { lazy } from "react";

const RELOAD_GUARD_KEY = "bethere.chunk-reload";

// After a redeploy, a tab still running the previous build asks for lazy
// chunks whose hashed filenames no longer exist; the SPA rewrite answers with
// index.html and the dynamic import fails with a MIME error. One full reload
// fetches the new build and fixes it. The sessionStorage guard makes sure a
// genuinely broken chunk (not a stale one) surfaces as an error instead of a
// reload loop: it is cleared on success so the NEXT deploy gets its one
// reload again.
export const lazyWithRetry = (importFn) =>
  lazy(async () => {
    try {
      const module = await importFn();
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return module;
    } catch (error) {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) !== null) {
        // Already reloaded once this session and it still fails: the chunk
        // is actually broken. Let the route errorElement handle it.
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
        throw error;
      }

      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();

      // The reload is already navigating; never resolve so React does not
      // flash the error boundary during teardown.
      return new Promise(() => {});
    }
  });
