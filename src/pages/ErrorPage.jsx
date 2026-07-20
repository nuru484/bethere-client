// src/pages/ErrorPage.jsx
//
// Router-level error surface plus the shared paper-and-ink ErrorPanel used
// by NotFoundPage and the global ErrorBoundary.
import PropTypes from "prop-types";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { Button } from "@/components/ui/button";

// Shared presentation for router errors, 404s and render crashes. `onBack`
// is injected because the ErrorBoundary renders outside the router and
// cannot use useNavigate. Home is a plain anchor on purpose: a full
// navigation resets whatever state broke.
export const ErrorPanel = ({ glyph, eyebrow, title, message, onBack, children }) => (
  <main className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
      <span className="inline-flex h-10 items-center rounded-full bg-foreground px-4 font-mono text-sm font-bold tracking-tight text-background">
        {glyph}
      </span>
      <p className="mt-6 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-2xl font-normal tracking-[-0.02em] text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <Button variant="outline" className="h-11 px-6" onClick={onBack}>
          Go back
        </Button>
        <Button asChild className="h-11 px-6">
          <a href="/">Home</a>
        </Button>
      </div>
      {children}
    </div>
  </main>
);

ErrorPanel.propTypes = {
  glyph: PropTypes.string.isRequired,
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorPanel
        glyph="404"
        eyebrow="Not found"
        title="This page does not exist"
        message="The address may be mistyped, or the page may have moved."
        onBack={goBack}
      />
    );
  }

  return (
    <ErrorPanel
      glyph="!"
      eyebrow="Error"
      title="Something went wrong"
      message={
        error?.statusText ||
        error?.message ||
        "We ran into an unexpected error. Try again in a moment."
      }
      onBack={goBack}
    />
  );
};

export default ErrorPage;
