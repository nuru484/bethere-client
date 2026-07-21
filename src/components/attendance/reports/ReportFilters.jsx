// src/components/attendance/reports/ReportFilters.jsx
//
// The simplified, DMS-style report filters: a compact grid of a search box,
// status, event type, a period preset (with optional custom range), and
// results-per-page - replacing the old long sidebar of many inputs. Controlled
// by the page; each control commits immediately (search is debounced).
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toDay = (date) => format(date, "yyyy-MM-dd");

const PERIODS = {
  all: { label: "All time", range: () => ({ checkInStartDate: undefined, checkInEndDate: undefined }) },
  last7: { label: "Last 7 days", range: () => ({ checkInStartDate: toDay(subDays(new Date(), 7)), checkInEndDate: toDay(new Date()) }) },
  last30: { label: "Last 30 days", range: () => ({ checkInStartDate: toDay(subDays(new Date(), 30)), checkInEndDate: toDay(new Date()) }) },
  month: { label: "This month", range: () => ({ checkInStartDate: toDay(startOfMonth(new Date())), checkInEndDate: toDay(new Date()) }) },
  year: { label: "This year", range: () => ({ checkInStartDate: toDay(startOfYear(new Date())), checkInEndDate: toDay(new Date()) }) },
  custom: { label: "Custom", range: null },
};

const FieldLabel = ({ children }) => (
  <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
    {children}
  </label>
);
FieldLabel.propTypes = { children: PropTypes.node };

const ReportFilters = ({ filters, onChange, onClear }) => {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [period, setPeriod] = useState("year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Debounce the search box so typing doesn't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchInput || "") !== (filters.search || "")) {
        onChange({ search: searchInput || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePeriod = (value) => {
    setPeriod(value);
    if (value !== "custom") onChange(PERIODS[value].range());
  };

  const applyCustom = () => {
    if (customStart && customEnd) {
      onChange({ checkInStartDate: customStart, checkInEndDate: customEnd });
    }
  };

  const typeValue = filters.isRecurring === true ? "recurring" : filters.isRecurring === false ? "oneoff" : "all";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <FieldLabel>Search</FieldLabel>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Attendee, event, or venue"
            className="h-9"
          />
        </div>

        <div>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => onChange({ status: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel>Event type</FieldLabel>
          <Select
            value={typeValue}
            onValueChange={(value) => onChange({ isRecurring: value === "all" ? undefined : value === "recurring" })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="oneoff">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel>Period</FieldLabel>
          <Select value={period} onValueChange={handlePeriod}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODS).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel>Per page</FieldLabel>
          <Select
            value={String(filters.limit || 10)}
            onValueChange={(value) => onChange({ limit: Number(value) })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {period === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <FieldLabel>From</FieldLabel>
            <input type="date" value={customStart} max={customEnd || undefined} onChange={(e) => setCustomStart(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <FieldLabel>To</FieldLabel>
            <input type="date" value={customEnd} min={customStart || undefined} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm" />
          </div>
          <Button size="sm" className="h-9" onClick={applyCustom} disabled={!customStart || !customEnd}>Apply</Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            setSearchInput("");
            setPeriod("year");
            setCustomStart("");
            setCustomEnd("");
            onClear();
          }}
        >
          Clear all
        </Button>
      </div>
    </div>
  );
};

ReportFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default ReportFilters;
