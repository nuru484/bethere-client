// src/components/ui/EmptyState.jsx
//
// Shared designed empty state for truly-empty views: mono eyebrow,
// semibold title, muted one-liner and optional action buttons on a
// bg-card surface. Rendered INSTEAD of filter bars, table shells and
// pagination when a dataset has no records at all.
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const EmptyState = ({ eyebrow, title, description, action, className }) => (
  <div
    className={cn(
      "flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-12 text-center sm:py-16",
      className
    )}
  >
    {eyebrow && (
      <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        {eyebrow}
      </p>
    )}
    <h3 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
      {title}
    </h3>
    {description && (
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    )}
    {action && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action}
      </div>
    )}
  </div>
);

EmptyState.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
};

export default EmptyState;
