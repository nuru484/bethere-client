// src/components/attendance-table/AttendanceTableFilters.jsx
//
// One filter bar for every attendance table. Flags decide which controls
// appear: `showSearch` (user + event tables), `showEventType` (user table),
// `showSessionId` (userEvent table). Status and the date range are always on.
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { normalizeFilterValue } from "@/lib/filter-value";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import PropTypes from "prop-types";

export function AttendanceTableFilters({
  table,
  filters,
  onFiltersChange,
  totalCount,
  showSearch = false,
  showEventType = false,
  showSessionId = false,
  searchPlaceholder = "Search...",
}) {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  // Free-text filters are debounced like search: firing onFiltersChange per
  // keystroke rewrote the URL and refired the server query on every letter.
  const [eventTypeInput, setEventTypeInput] = useState(filters.eventType || "");
  const [sessionIdInput, setSessionIdInput] = useState(filters.sessionId || "");
  // Derived, not state: the filters come from the URL, so back/forward (and
  // any other external change) has to move the pickers too. Seeding local
  // state once left the calendar and the button label showing a stale day
  // while the "From"/"To" badges below already showed the new one.
  const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

  const debouncedSearch = useDebounce(searchInput, 500);
  const debouncedEventType = useDebounce(eventTypeInput, 500);
  const debouncedSessionId = useDebounce(sessionIdInput, 500);

  // Normalize both sides: an empty box is "" while an absent URL filter is
  // undefined, and comparing those raw made this fire on every mount, which
  // reset the list to page 1 (see src/lib/filter-value.js).
  useEffect(() => {
    if (
      showSearch &&
      normalizeFilterValue(debouncedSearch) !==
        normalizeFilterValue(filters.search)
    ) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [showSearch, debouncedSearch, filters.search, onFiltersChange]);

  useEffect(() => {
    if (
      showEventType &&
      normalizeFilterValue(debouncedEventType) !==
        normalizeFilterValue(filters.eventType)
    ) {
      onFiltersChange({ eventType: debouncedEventType || undefined });
    }
  }, [showEventType, debouncedEventType, filters.eventType, onFiltersChange]);

  useEffect(() => {
    if (
      showSessionId &&
      normalizeFilterValue(debouncedSessionId) !==
        normalizeFilterValue(filters.sessionId)
    ) {
      onFiltersChange({ sessionId: debouncedSessionId || undefined });
    }
  }, [showSessionId, debouncedSessionId, filters.sessionId, onFiltersChange]);

  const getStatusFilterValue = () => {
    if (filters.status === "PRESENT") return "present";
    if (filters.status === "LATE") return "late";
    if (filters.status === "ABSENT") return "absent";
    return "all";
  };

  const handleStatusFilterChange = (value) => {
    let status;
    if (value === "present") status = "PRESENT";
    else if (value === "late") status = "LATE";
    else if (value === "absent") status = "ABSENT";
    else status = undefined;

    onFiltersChange({ status });
  };

  const handleStartDateChange = (date) => {
    onFiltersChange({
      startDate: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const handleEndDateChange = (date) => {
    onFiltersChange({
      endDate: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const hasFiltersApplied =
    filters.status !== undefined ||
    (showSearch && filters.search !== undefined) ||
    (showEventType && filters.eventType !== undefined) ||
    (showSessionId && filters.sessionId !== undefined) ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  const clearFilters = () => {
    setSearchInput("");
    setEventTypeInput("");
    setSessionIdInput("");
    onFiltersChange({
      search: undefined,
      status: undefined,
      eventType: undefined,
      sessionId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Count */}
      <div className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
        {totalCount} total
      </div>

      {/* Filters Row */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search Input */}
        {showSearch && (
          <div className="flex-1 min-w-0">
            <Input
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          {/* Status Filter */}
          <Select
            value={getStatusFilterValue()}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>

          {/* Event Type Filter */}
          {showEventType && (
            <Input
              placeholder="Event type..."
              value={eventTypeInput}
              onChange={(e) => setEventTypeInput(e.target.value)}
              className="w-full sm:w-[140px]"
            />
          )}

          {/* Session Filter */}
          {showSessionId && (
            <Input
              placeholder="Session ID..."
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              className="w-full sm:w-[140px]"
            />
          )}

          {/* Date Range Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[160px]">
                {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[160px]">
                {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasFiltersApplied && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="whitespace-nowrap"
              >
                <ChevronDown className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground mb-2">
                  Toggle columns
                </div>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/([A-Z])/g, " $1").trim()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFiltersApplied && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Active filters:
          </span>
          {showSearch && filters.search && (
            <Badge variant="secondary" className="gap-2">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchInput("");
                  onFiltersChange({ search: undefined });
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.status !== undefined && (
            <Badge variant="secondary" className="gap-2">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ status: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {showEventType && filters.eventType && (
            <Badge variant="secondary" className="gap-2">
              Type: {filters.eventType}
              <button
                onClick={() => {
                  setEventTypeInput("");
                  onFiltersChange({ eventType: undefined });
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {showSessionId && filters.sessionId && (
            <Badge variant="secondary" className="gap-2">
              Session: {filters.sessionId}
              <button
                onClick={() => {
                  setSessionIdInput("");
                  onFiltersChange({ sessionId: undefined });
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.startDate && (
            <Badge variant="secondary" className="gap-2">
              From: {format(new Date(filters.startDate), "MMM dd, yyyy")}
              <button
                onClick={() => onFiltersChange({ startDate: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-2">
              To: {format(new Date(filters.endDate), "MMM dd, yyyy")}
              <button
                onClick={() => onFiltersChange({ endDate: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

AttendanceTableFilters.propTypes = {
  table: PropTypes.shape({
    getAllColumns: PropTypes.func.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    eventType: PropTypes.string,
    sessionId: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  showSearch: PropTypes.bool,
  showEventType: PropTypes.bool,
  showSessionId: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
};
