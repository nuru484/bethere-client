// src/components/attendance/reports/Filters.jsx
import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetAllUsers } from "@/hooks/useUsers";
import { useDebounce } from "@/hooks/useDebounce";

// The free-text filters that are debounced before reaching the parent.
const TEXT_FILTER_KEYS = [
  "search",
  "eventName",
  "eventType",
  "locationName",
  "city",
  "country",
];

const initialLocalState = (filters) => ({
  search: filters.search || "",
  eventName: filters.eventName || "",
  eventType: filters.eventType || "",
  locationName: filters.locationName || "",
  city: filters.city || "",
  country: filters.country || "",
  userSearchTerm: "",
  checkInStartDate: undefined,
  checkInEndDate: undefined,
  sessionStartDate: undefined,
  sessionEndDate: undefined,
});

export const AttendanceFilters = ({ filters, onFiltersChange, onReset }) => {
  // All local (not-yet-committed) state lives in one object: the free-text
  // inputs (debounced so typing doesn't fire a report request on every
  // keystroke), the user picker search, and the date-picker selections.
  const [local, setLocal] = useState(() => initialLocalState(filters));

  const setLocalField = (key, value) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  // Memoized on the individual strings so a date selection doesn't re-arm
  // the text debounce timer.
  const textValues = useMemo(
    () => ({
      search: local.search,
      eventName: local.eventName,
      eventType: local.eventType,
      locationName: local.locationName,
      city: local.city,
      country: local.country,
    }),
    [
      local.search,
      local.eventName,
      local.eventType,
      local.locationName,
      local.city,
      local.country,
    ]
  );

  const debouncedText = useDebounce(textValues, 500);
  const debouncedUserSearch = useDebounce(local.userSearchTerm, 400);

  // Fetch users with debounced search
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers({
    page: 1,
    limit: 10,
    search: debouncedUserSearch,
  });

  const set = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Commit the debounced text values up to the parent once they settle, in a
  // single emission carrying only the keys that changed. An empty string
  // clears a filter (sends no param) rather than serializing "".
  useEffect(() => {
    const changed = {};
    for (const key of TEXT_FILTER_KEYS) {
      const next = debouncedText[key] || undefined;
      if (next !== filters[key]) changed[key] = next;
    }
    if (Object.keys(changed).length > 0) {
      onFiltersChange(changed);
    }
  }, [debouncedText, filters, onFiltersChange]);

  // Reset clears the parent filters and all local state, including the date
  // pickers (which otherwise keep stale selections after a reset).
  const handleReset = () => {
    setLocal(initialLocalState({}));
    onReset();
  };

  const applyCheckInDateRange = () => {
    if (local.checkInStartDate) {
      set("checkInStartDate", format(local.checkInStartDate, "yyyy-MM-dd"));
    }
    if (local.checkInEndDate) {
      set("checkInEndDate", format(local.checkInEndDate, "yyyy-MM-dd"));
    }
  };

  const applySessionDateRange = () => {
    if (local.sessionStartDate) {
      set("sessionStartDate", format(local.sessionStartDate, "yyyy-MM-dd"));
    }
    if (local.sessionEndDate) {
      set("sessionEndDate", format(local.sessionEndDate, "yyyy-MM-dd"));
    }
  };

  const handleUserSearch = (val) => {
    setLocalField("userSearchTerm", val);
  };

  const availableUsers = usersData?.data || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-display font-normal tracking-[-0.02em]">
            Filters
          </CardTitle>
          <CardDescription className="text-sm">
            Refine attendance reports
          </CardDescription>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm">
          Reset
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label>General Search</Label>
          <div className="relative">
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                strokeWidth={1.5}
              />
            <Input
              placeholder="Search users, events, locations..."
              value={local.search}
              onChange={(e) => setLocalField("search", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* User Selection */}
        <div className="space-y-2">
          <Label>User</Label>
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Search users by name or email..."
                value={local.userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.userId ? String(filters.userId) : ""}
              onValueChange={(v) =>
                set("userId", v && v !== "all" ? Number(v) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Users</SelectItem>
                {isUsersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={String(user.id)}
                      className="py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email || user.phone || `ID: ${user.id}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No users found
                    </p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || ""}
            onValueChange={(v) => set("status", v === "all" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Event Filters */}
        <div className="space-y-3">
          <Label className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Event Filters
          </Label>

          <div className="space-y-2">
            <Label className="text-sm">Event Name</Label>
            <Input
              placeholder="Search by event title..."
              value={local.eventName}
              onChange={(e) => setLocalField("eventName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Event Type</Label>
            <Input
              placeholder="e.g., Conference, Workshop..."
              value={local.eventType}
              onChange={(e) => setLocalField("eventType", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Recurring Events</Label>
            <Select
              value={
                filters.isRecurring === undefined
                  ? "all"
                  : String(filters.isRecurring)
              }
              onValueChange={(v) =>
                set("isRecurring", v === "all" ? undefined : v === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="true">Recurring Only</SelectItem>
                <SelectItem value="false">Non-Recurring Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location Filters */}
        <div className="space-y-3">
          <Label className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Location Filters
          </Label>

          <div className="space-y-2">
            <Label className="text-sm">Location Name</Label>
            <Input
              placeholder="Search by location name..."
              value={local.locationName}
              onChange={(e) => setLocalField("locationName", e.target.value)}
            />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">City</Label>
              <Input
                placeholder="e.g., Accra"
                value={local.city}
                onChange={(e) => setLocalField("city", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Country</Label>
              <Input
                placeholder="e.g., Ghana"
                value={local.country}
                onChange={(e) => setLocalField("country", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Check-In Date Range */}
        <div className="space-y-3">
          <Label className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Check-In Date Range
          </Label>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !local.checkInStartDate && "text-muted-foreground"
                  )}
                >
                  {local.checkInStartDate
                    ? format(local.checkInStartDate, "MMM d, yyyy")
                    : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={local.checkInStartDate}
                  onSelect={(d) => setLocalField("checkInStartDate", d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !local.checkInEndDate && "text-muted-foreground"
                  )}
                >
                  {local.checkInEndDate
                    ? format(local.checkInEndDate, "MMM d, yyyy")
                    : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={local.checkInEndDate}
                  onSelect={(d) => setLocalField("checkInEndDate", d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={applyCheckInDateRange}
            disabled={!local.checkInStartDate && !local.checkInEndDate}
            size="sm"
            className="w-full sm:w-auto"
          >
            Apply Check-In Range
          </Button>
        </div>

        {/* Session Date Range */}
        <div className="space-y-3">
          <Label className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Session Date Range
          </Label>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !local.sessionStartDate && "text-muted-foreground"
                  )}
                >
                  {local.sessionStartDate
                    ? format(local.sessionStartDate, "MMM d, yyyy")
                    : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={local.sessionStartDate}
                  onSelect={(d) => setLocalField("sessionStartDate", d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !local.sessionEndDate && "text-muted-foreground"
                  )}
                >
                  {local.sessionEndDate
                    ? format(local.sessionEndDate, "MMM d, yyyy")
                    : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={local.sessionEndDate}
                  onSelect={(d) => setLocalField("sessionEndDate", d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={applySessionDateRange}
            disabled={!local.sessionStartDate && !local.sessionEndDate}
            size="sm"
            className="w-full sm:w-auto"
          >
            Apply Session Range
          </Button>
        </div>

        {/* Pagination */}
        <div className="space-y-2">
          <Label>Results per page</Label>
          <Select
            value={(filters.limit || 10).toString()}
            onValueChange={(v) => set("limit", Number(v))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

AttendanceFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    userId: PropTypes.number,
    eventName: PropTypes.string,
    locationName: PropTypes.string,
    status: PropTypes.string,
    isRecurring: PropTypes.bool,
    eventType: PropTypes.string,
    checkInStartDate: PropTypes.string,
    checkInEndDate: PropTypes.string,
    sessionStartDate: PropTypes.string,
    sessionEndDate: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    limit: PropTypes.number,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};
