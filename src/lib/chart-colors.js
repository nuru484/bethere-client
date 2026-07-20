// src/lib/chart-colors.js
//
// Single source of truth for the attendance chart palette. The same
// status -> colour mapping was previously copy-pasted across every dashboard
// chart; centralising it keeps the line, bar and pie charts visually in sync.
// Values are theme-aware CSS variables defined in the Tailwind theme.

// Attendance status colours (shared by the line, bar and pie charts).
export const STATUS_COLOR = {
  present: "hsl(var(--chart-1))",
  late: "hsl(var(--chart-4))",
  absent: "hsl(var(--chart-3))",
  // The "total" trend line on the attendance line chart.
  total: "hsl(var(--chart-5))",
};

// Event type colours (recurring vs one-off), used by the event-type charts.
export const EVENT_TYPE_COLOR = {
  recurring: "hsl(var(--chart-1))",
  nonRecurring: "hsl(var(--chart-3))",
};

// Slice builders for the shared pie chart: turn a status/event-type breakdown
// into the coloured {name, value, color} segments StatusPieChart expects. Kept
// here so the two dashboards build identical, correctly-coloured data.
export const statusPieData = (counts) => [
  { name: "Present", value: counts?.present || 0, color: STATUS_COLOR.present },
  { name: "Late", value: counts?.late || 0, color: STATUS_COLOR.late },
  { name: "Absent", value: counts?.absent || 0, color: STATUS_COLOR.absent },
];

export const eventTypePieData = (breakdown) => [
  {
    name: "Recurring Events",
    value: breakdown?.recurring || 0,
    color: EVENT_TYPE_COLOR.recurring,
  },
  {
    name: "Non-Recurring Events",
    value: breakdown?.nonRecurring || 0,
    color: EVENT_TYPE_COLOR.nonRecurring,
  },
];
