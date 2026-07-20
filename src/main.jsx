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

const client = new QueryClient();

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
                  duration: 10000 * 3,
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
