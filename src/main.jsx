import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import Routes from "./routes";
import ErrorBoundary from "./lib/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";
import { initSentry } from "./lib/sentry";

// No-op unless VITE_SENTRY_DSN is set (lazy-loads the SDK when it is).
initSentry();

// Retry only what a retry can fix: 5xx and network-class failures. 4xx
// answers (403 forbidden, 404 deleted record, 400 bad input) are final -
// retrying them just triples server load and delays the error panel by
// seconds of pointless backoff.
const isRetryableError = (error) =>
  (typeof error?.status === "number" && error.status >= 500) ||
  error?.status === "FETCH_ERROR" ||
  error?.status === "TIMEOUT_ERROR";

// Global caching conventions, hoisted from what most hooks used to repeat
// per-query: dashboards and lists tolerate 5 minutes of staleness, linger in
// the cache for 30, and retry twice before erroring a panel. Focus refetches
// are off - data here changes through explicit actions, and those mutations
// invalidate exactly what they touched. Anything that also changes from
// ANOTHER session - attendance rows, the moderation queue, the user/admin/
// event directories, profiles - sets refetchOnWindowFocus: true back on
// locally, and every override carries a comment explaining why.
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) =>
        failureCount < 2 && isRetryableError(error),
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              toastOptions={{
                duration: 5000,
                // Theme-aware surface: reads the design tokens so the toast
                // follows light/dark. The icon "cut-out" (secondary) matches
                // the toast background in either theme.
                style: {
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontFamily: '"Instrument Sans", ui-sans-serif, sans-serif',
                  fontSize: "14px",
                },
                success: {
                  iconTheme: {
                    primary: "#3ecf8e",
                    secondary: "hsl(var(--popover))",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "hsl(var(--destructive))",
                    secondary: "hsl(var(--popover))",
                  },
                },
                loading: {
                  duration: 1000 * 30,
                },
              }}
            />
            <Routes />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
