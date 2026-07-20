// src/lib/ErrorBoundary.jsx
//
// Global render-crash boundary. Reports to Sentry (no-op unless configured)
// and renders the shared ErrorPanel. It mounts outside the router, so "back"
// uses the history API directly instead of useNavigate.
import React from "react";
import PropTypes from "prop-types";
import { ErrorPanel } from "@/pages/ErrorPage";
import { reportError } from "@/lib/sentry";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // A caller can hand us a value that changes on every navigation (see
  // Layout.jsx). Clearing the error here rather than via a `key` is
  // deliberate: a changing key would also remount a HEALTHY subtree, and
  // filter/page changes are same-pathname navigations now, so every debounced
  // keystroke would tear the list page down mid-typing.
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    // No-op unless Sentry was initialized (VITE_SENTRY_DSN set).
    reportError(error, { componentStack: errorInfo?.componentStack });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPanel
          glyph="!"
          eyebrow="Error"
          title="Something went wrong"
          message="An unexpected error occurred. Go back and try again, or start over from the home page."
          onBack={() => window.history.back()}
        >
          {import.meta.env.DEV && (
            <details className="mt-6 whitespace-pre-wrap break-words text-left text-xs text-destructive">
              <summary className="cursor-pointer font-mono font-bold uppercase tracking-tight">
                Error details (dev only)
              </summary>
              <p className="mt-2">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 overflow-x-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </ErrorPanel>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  // Any value that changes per navigation; a change clears a shown error.
  resetKey: PropTypes.string,
};

export default ErrorBoundary;
