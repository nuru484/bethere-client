import React from "react";
import PropTypes from "prop-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert className="max-w-lg w-full border-gray-200 shadow-sm">
            <AlertTitle className="text-lg font-semibold">
              Something went wrong
            </AlertTitle>
            <AlertDescription>
              <p className="text-muted-foreground mt-1">
                An unexpected error occurred. Please reload the page or return
                to your dashboard. If the problem persists, contact support.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button onClick={() => window.location.reload()}>
                  Reload
                </Button>
                <Button variant="outline" asChild>
                  <a href="/dashboard">Go to dashboard</a>
                </Button>
              </div>
              {import.meta.env.DEV && (
                <details className="mt-4 text-xs text-red-600 whitespace-pre-wrap break-words">
                  <summary className="cursor-pointer font-medium">
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
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
