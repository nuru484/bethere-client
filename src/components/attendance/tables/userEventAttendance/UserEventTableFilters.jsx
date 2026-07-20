// src/components/attendance/tables/userEventAttendance/UserEventTableFilters.jsx
import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import PropTypes from "prop-types";

export function UserEventTableFilters({
  table,
  filters,
  onFiltersChange,
  totalCount,
}) {
  const selectedCount = table.getSelectedRowModel().rows.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const [startDate, setStartDate] = useState(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

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
    setStartDate(date);
    onFiltersChange({
      startDate: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    onFiltersChange({
      endDate: date ? format(date, "yyyy-MM-dd") : undefined,
    });
  };

  const hasFiltersApplied =
    filters.status !== undefined ||
    filters.sessionId !== undefined ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      status: undefined,
      sessionId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3 order-2 lg:order-1">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-lg border">
              <Badge variant="secondary" className="font-medium">
                {selectedCount} selected {isAllSelected && "(All)"}
              </Badge>
            </div>
          ) : (
            <div className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
              {totalCount} total
            </div>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col xl:flex-row gap-4">
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

          {/* Session Filter */}
          <Input
            placeholder="Session ID..."
            value={filters.sessionId || ""}
            onChange={(e) =>
              onFiltersChange({
                sessionId: e.target.value || undefined,
              })
            }
            className="w-full sm:w-[140px]"
          />

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
          {filters.sessionId && (
            <Badge variant="secondary" className="gap-2">
              Session: {filters.sessionId}
              <button
                onClick={() => onFiltersChange({ sessionId: undefined })}
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
                onClick={() => {
                  setStartDate(undefined);
                  onFiltersChange({ startDate: undefined });
                }}
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
                onClick={() => {
                  setEndDate(undefined);
                  onFiltersChange({ endDate: undefined });
                }}
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

UserEventTableFilters.propTypes = {
  table: PropTypes.shape({
    getSelectedRowModel: PropTypes.func.isRequired,
    getAllColumns: PropTypes.func.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    status: PropTypes.oneOf(["PRESENT", "LATE", "ABSENT"]),
    sessionId: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
};
