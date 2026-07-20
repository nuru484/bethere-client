// src/components/dashboard/DateRangeSelector.jsx
//
// Compact period picker for the dashboards: a single preset select that
// applies immediately, plus two date inputs and an Apply button that only
// appear when "Custom" is chosen. Emits { startDate, endDate } strings via
// onDateChange, same contract the dashboard queries already expect.
import { useState } from "react";
import PropTypes from "prop-types";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
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

  const handleApply = () => {
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
              onChange={(e) => setEndDate(e.target.value)}
              className={dateInputClassName}
              disabled={isLoading}
            />
          </div>
          <Button
            size="sm"
            className="h-9"
            onClick={handleApply}
            disabled={isLoading || !startDate || !endDate}
          >
            Apply
          </Button>
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
