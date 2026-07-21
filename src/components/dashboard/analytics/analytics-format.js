// src/components/dashboard/analytics/analytics-format.js
//
// Small, shared formatters for the analytics widgets so every card renders
// numbers, percentages, and durations the same way.

const intFmt = new Intl.NumberFormat("en-US");

/** A whole-number count, thousands-separated. */
export const fmtInt = (value) => intFmt.format(Math.round(Number(value) || 0));

/** A percentage; `digits` decimals (default 0), always with the % sign. */
export const fmtPercent = (value, digits = 0) =>
  `${(Number(value) || 0).toFixed(digits)}%`;

/**
 * A minutes value as a human duration: "0 min", "3.8 min", "1h 05m". Whole
 * hours switch to h/m so large lateness stays readable.
 */
export const fmtMinutes = (value) => {
  const minutes = Number(value) || 0;
  if (minutes < 60) {
    const rounded = Math.round(minutes * 10) / 10;
    return `${rounded} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
};

/** Renders a KPI value by its declared unit. */
export const fmtKpi = (value, unit) => {
  if (unit === "percent") return fmtPercent(value, value % 1 === 0 ? 0 : 1);
  if (unit === "minutes") return fmtMinutes(value);
  return fmtInt(value);
};

/**
 * Renders a chart bucket label for an axis: "00:00" (hour) stays as-is,
 * "2026-03" (month) -> "Mar", "2026-03-10" (day/week) -> "Mar 10". Anything
 * else is passed through unchanged.
 */
export const formatBucketLabel = (label) => {
  if (typeof label !== "string") return label;
  if (/^\d{2}:\d{2}$/.test(label)) return label;
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [year, month] = label.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", { month: "short" });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [year, month, day] = label.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleString("en-US", { month: "short", day: "numeric" });
  }
  return label;
};

/** Letter-grade → tailwind text colour for the integrity score. */
export const gradeColor = (grade) =>
  ({
    A: "text-emerald-600 dark:text-emerald-400",
    B: "text-emerald-600 dark:text-emerald-400",
    C: "text-amber-600 dark:text-amber-400",
    D: "text-orange-600 dark:text-orange-400",
    F: "text-destructive",
  })[grade] || "text-muted-foreground";
