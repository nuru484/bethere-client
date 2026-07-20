// src/components/ui/ErrorMessage.jsx
import PropTypes from "prop-types";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ErrorMessage = ({
  error,
  onRetry,
  title = "Something went wrong",
  className = "",
}) => {
  const navigate = useNavigate();

  const getErrorMessage = (error) => {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred. Please try again.";
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 sm:py-16 sm:px-6 w-full bg-card border border-border rounded-2xl ${className}`}
    >
      {/* Icon */}
      <div className="relative mb-5 sm:mb-6">
        <div className="bg-background p-3 sm:p-4 rounded-2xl border border-border">
          <AlertCircle
            className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-xs sm:max-w-md space-y-2 sm:space-y-3">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight break-words">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm break-words">
          {errorMessage}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-8 w-full">
        {/* Go back button */}
        <button
          onClick={() => navigate(-1)}
          className="group hover:cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 rounded-lg border border-primary/25 bg-transparent text-primary font-mono text-xs font-bold uppercase tracking-tight hover:bg-primary hover:text-primary-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap"
        >
          <ArrowLeft
            className="w-4 h-4 transition-transform group-hover:-translate-x-1 duration-300"
            strokeWidth={1.5}
          />
          Go back
        </button>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="group hover:cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-tight hover:bg-black dark:hover:bg-primary/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap"
          >
            <RefreshCw
              className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300"
              strokeWidth={1.5}
            />
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)])
    .isRequired,
  onRetry: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default ErrorMessage;
