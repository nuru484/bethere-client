// src/components/dashboard/analytics/TrendIndicator.jsx
//
// The period-over-period trend chip: an arrow + magnitude. Colour follows
// meaning, not direction - for `inverse` metrics (lateness, anomalies) a
// downward move is the good one and reads green.
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const TrendIndicator = ({ trend, inverse = false, label = "vs prev", className }) => {
  const direction = trend?.direction ?? "neutral";
  const percentage = trend?.percentage ?? 0;

  if (direction === "neutral") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Minus className="h-3.5 w-3.5" />
        <span>0%</span>
        {label && <span className="text-muted-foreground/70">{label}</span>}
      </span>
    );
  }

  const isUp = direction === "upward";
  const isGood = inverse ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{percentage}%</span>
      {label && <span className="font-normal text-muted-foreground/70">{label}</span>}
    </span>
  );
};

TrendIndicator.propTypes = {
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(["upward", "downward", "neutral"]),
    percentage: PropTypes.number,
  }),
  inverse: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
};

export default TrendIndicator;
