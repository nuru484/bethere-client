// src/components/ui/AsyncBoundary.jsx
//
// The loading -> skeleton / error -> ErrorMessage / else -> content triad that
// was hand-written across the list and review pages, in one place. Each page
// still supplies its own skeleton (the shapes differ) and keeps any bespoke
// states (e.g. a 404 empty state or an after-success empty state) around this.
//
// The API-error extraction lives here so callers just hand over the raw query
// error. By default the error panel is centred in a min-height wrapper (what
// the table pages use); pass errorClassName={null} to render it bare (what the
// review tabs use, where a persistent header already frames the content).
import PropTypes from "prop-types";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const AsyncBoundary = ({
  isLoading,
  isError,
  error,
  onRetry,
  skeleton,
  children,
  errorClassName = "flex items-center justify-center min-h-96 px-4",
}) => {
  if (isLoading) return skeleton;

  if (isError) {
    const message = extractApiErrorMessage(error).message;
    const panel = <ErrorMessage error={message} onRetry={onRetry} />;
    return errorClassName ? (
      <div className={errorClassName}>{panel}</div>
    ) : (
      panel
    );
  }

  return children;
};

AsyncBoundary.propTypes = {
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  // Raw query error; extractApiErrorMessage turns it into a message.
  error: PropTypes.any,
  onRetry: PropTypes.func,
  skeleton: PropTypes.node,
  children: PropTypes.node,
  // Wrapper class for the error panel; null/"" renders the panel bare.
  errorClassName: PropTypes.string,
};

export default AsyncBoundary;
