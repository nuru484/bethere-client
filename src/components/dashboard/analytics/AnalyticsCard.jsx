// src/components/dashboard/analytics/AnalyticsCard.jsx
//
// The stateful shell every analytics widget renders inside: a titled card with
// a mono eyebrow, optional subtitle/action, and a body that resolves the four
// query states (loading -> layout-mirroring skeleton, error -> inline retry,
// empty -> branded EmptyState, data -> children). Centralising this keeps every
// widget's boilerplate out of the chart code.
import PropTypes from "prop-types";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { cn } from "@/lib/utils";

const AnalyticsCard = ({
  eyebrow,
  title,
  subtitle,
  action,
  isLoading,
  isError,
  error,
  onRetry,
  isEmpty,
  emptyTitle = "Nothing to show yet",
  emptyDescription = "Data will appear here once attendance is recorded for this period.",
  minHeight = 280,
  bodyClassName,
  className,
  children,
}) => (
  <Card className={cn("flex flex-col", className)}>
    {(title || action) && (
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {title && (
            <h3 className="mt-0.5 truncate font-display text-base font-medium leading-tight text-foreground sm:text-lg">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
    )}
    <CardContent className={cn("flex-1", bodyClassName)} style={{ minHeight }}>
      {isLoading ? (
        <div className="flex h-full min-h-[inherit] flex-col gap-3" style={{ minHeight }}>
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div
          className="flex flex-col items-center justify-center gap-3 text-center"
          style={{ minHeight }}
        >
          <AlertTriangle className="h-8 w-8 text-destructive/70" />
          <p className="max-w-xs text-sm text-muted-foreground">
            {extractApiErrorMessage(error).message}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-center" style={{ minHeight }}>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

AnalyticsCard.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  error: PropTypes.any,
  onRetry: PropTypes.func,
  isEmpty: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  minHeight: PropTypes.number,
  bodyClassName: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default AnalyticsCard;
