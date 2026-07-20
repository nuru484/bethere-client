// src/components/dashboard/DateRangeSelector.jsx
//
// Compact period picker for the dashboards: a single preset select that
// applies immediately, plus two date inputs and an Apply button that only
// appear when "Custom" is chosen. Emits { startDate, endDate } strings via
// onDateChange, same contract the dashboard queries already expect.
import { useState } from "react";
import PropTypes from "prop-types";
import {
  format,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toDay = (date) => format(date, "yyyy-MM-dd");

const PRESETS = [
  { value: "TODAY", label: "Today" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "THIS_MONTH", label: "This month" },
  { value: "CUSTOM", label: "Custom" },
];

const getPresetRange = (preset) => {
  const today = new Date();
  switch (preset) {
    case "TODAY":
      return { startDate: toDay(today), endDate: toDay(today) };
    case "LAST_7_DAYS":
      return { startDate: toDay(subDays(today, 7)), endDate: toDay(today) };
    case "THIS_MONTH":
      return {
        startDate: toDay(startOfMonth(today)),
        endDate: toDay(endOfMonth(today)),
      };
    case "LAST_30_DAYS":
    default:
      return { startDate: toDay(subDays(today, 30)), endDate: toDay(today) };
  }
};

// The server rejects a dashboard range longer than this with a 400, which the
// panels render as a full-panel error. Constrain the picker instead so the UI
// cannot build a request the API will refuse.
const MAX_RANGE_DAYS = 400;

// The date inputs hold "yyyy-MM-dd"; parseISO reads that as LOCAL midnight,
// unlike new Date("yyyy-MM-dd") which is UTC and shifts a day west of GMT.
const fromDay = (value) => (value ? parseISO(value) : null);

const dateInputClassName =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 sm:w-36";

const DateRangeSelector = ({ onDateChange, isLoading }) => {
  const [preset, setPreset] = useState("LAST_30_DAYS");
  const defaultRange = getPresetRange("LAST_30_DAYS");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const handlePresetChange = (value) => {
    setPreset(value);
    if (value === "CUSTOM") return;

    const range = getPresetRange(value);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    onDateChange(range);
  };

  // The min/max attributes below keep the native picker inside the window, but
  // a typed-in or keyboard-entered date can still land outside it, so the same
  // limit is enforced here (Apply stays disabled) with an inline explanation.
  const rangeDays =
    startDate && endDate
      ? differenceInCalendarDays(fromDay(endDate), fromDay(startDate))
      : 0;
  const isRangeTooLong = rangeDays > MAX_RANGE_DAYS;

  const earliestStart = endDate
    ? toDay(subDays(fromDay(endDate), MAX_RANGE_DAYS))
    : undefined;
  const latestEnd = startDate
    ? toDay(addDays(fromDay(startDate), MAX_RANGE_DAYS))
    : undefined;

  const handleApply = () => {
    if (isRangeTooLong) return;
    onDateChange({ startDate, endDate });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label
          htmlFor="dashboard-period"
          className="block font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
        >
          Period
        </label>
        <Select
          value={preset}
          onValueChange={handlePresetChange}
          disabled={isLoading}
        >
          <SelectTrigger
            id="dashboard-period"
            className="h-9 w-full cursor-pointer bg-background sm:w-44"
          >
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === "CUSTOM" && (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="dashboard-period-from"
              className="block font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
            >
              From
            </label>
            <input
              id="dashboard-period-from"
              type="date"
              value={startDate}
              min={earliestStart}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className={dateInputClassName}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="dashboard-period-to"
              className="block font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
            >
              To
            </label>
            <input
              id="dashboard-period-to"
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={latestEnd}
              onChange={(e) => setEndDate(e.target.value)}
              className={dateInputClassName}
              disabled={isLoading}
            />
          </div>
          <Button
            size="sm"
            className="h-9"
            onClick={handleApply}
            disabled={isLoading || !startDate || !endDate || isRangeTooLong}
          >
            Apply
          </Button>
          {isRangeTooLong && (
            <p
              role="alert"
              className="w-full text-xs leading-snug text-destructive"
            >
              Pick a range of {MAX_RANGE_DAYS} days or fewer.
            </p>
          )}
        </>
      )}
    </div>
  );
};

DateRangeSelector.propTypes = {
  onDateChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default DateRangeSelector;
