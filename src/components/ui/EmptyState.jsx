// src/components/ui/EmptyState.jsx
//
// Shared designed empty state for truly-empty views: mono eyebrow,
// semibold title, muted one-liner and optional action buttons. Standalone it
// draws its own bordered bg-card panel (rendered INSTEAD of filter bars, table
// shells and pagination when a dataset has no records at all); pass
// `bordered={false}` when it already sits INSIDE a card (e.g. a dashboard
// widget) so it doesn't nest a box inside a box.
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const EmptyState = ({ eyebrow, title, description, action, className, bordered = true }) => (
  <div
    className={cn(
      "flex w-full flex-col items-center justify-center px-4 text-center",
      bordered
        ? "rounded-2xl border border-border bg-card py-12 sm:py-16"
        : "py-6",
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
  bordered: PropTypes.bool,
};

export default EmptyState;
