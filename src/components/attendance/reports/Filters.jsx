// src/components/attendance/reports/Filters.jsx
import { useState, useEffect } from "react";
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

export const AttendanceFilters = ({ filters, onFiltersChange, onReset }) => {
  const [checkInStartDate, setCheckInStartDate] = useState();
  const [checkInEndDate, setCheckInEndDate] = useState();
  const [sessionStartDate, setSessionStartDate] = useState();
  const [sessionEndDate, setSessionEndDate] = useState();
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Local state for the free-text filters so typing is debounced and doesn't
  // fire a report request on every keystroke.
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [eventNameInput, setEventNameInput] = useState(filters.eventName || "");
  const [eventTypeInput, setEventTypeInput] = useState(filters.eventType || "");
  const [locationNameInput, setLocationNameInput] = useState(
    filters.locationName || ""
  );
  const [cityInput, setCityInput] = useState(filters.city || "");
  const [countryInput, setCountryInput] = useState(filters.country || "");

  const debouncedUserSearch = useDebounce(userSearchTerm, 400);
  const debouncedSearch = useDebounce(searchInput, 500);
  const debouncedEventName = useDebounce(eventNameInput, 500);
  const debouncedEventType = useDebounce(eventTypeInput, 500);
  const debouncedLocationName = useDebounce(locationNameInput, 500);
  const debouncedCity = useDebounce(cityInput, 500);
  const debouncedCountry = useDebounce(countryInput, 500);

  // Fetch users with debounced search
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers({
    page: 1,
    limit: 10,
    search: debouncedUserSearch,
  });

  const set = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Commit each debounced text value up to the parent once it settles. An empty
  // string clears the filter (sends no param) rather than serializing "".
  useEffect(() => {
    if ((debouncedSearch || undefined) !== filters.search) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  useEffect(() => {
    if ((debouncedEventName || undefined) !== filters.eventName) {
      onFiltersChange({ eventName: debouncedEventName || undefined });
    }
  }, [debouncedEventName, filters.eventName, onFiltersChange]);

  useEffect(() => {
    if ((debouncedEventType || undefined) !== filters.eventType) {
      onFiltersChange({ eventType: debouncedEventType || undefined });
    }
  }, [debouncedEventType, filters.eventType, onFiltersChange]);

  useEffect(() => {
    if ((debouncedLocationName || undefined) !== filters.locationName) {
      onFiltersChange({ locationName: debouncedLocationName || undefined });
    }
  }, [debouncedLocationName, filters.locationName, onFiltersChange]);

  useEffect(() => {
    if ((debouncedCity || undefined) !== filters.city) {
      onFiltersChange({ city: debouncedCity || undefined });
    }
  }, [debouncedCity, filters.city, onFiltersChange]);

  useEffect(() => {
    if ((debouncedCountry || undefined) !== filters.country) {
      onFiltersChange({ country: debouncedCountry || undefined });
    }
  }, [debouncedCountry, filters.country, onFiltersChange]);

  // Reset clears the parent filters and all local state, including the date
  // pickers (which otherwise keep stale selections after a reset).
  const handleReset = () => {
    setSearchInput("");
    setEventNameInput("");
    setEventTypeInput("");
    setLocationNameInput("");
    setCityInput("");
    setCountryInput("");
    setUserSearchTerm("");
    setCheckInStartDate(undefined);
    setCheckInEndDate(undefined);
    setSessionStartDate(undefined);
    setSessionEndDate(undefined);
    onReset();
  };

  const applyCheckInDateRange = () => {
    if (checkInStartDate) {
      set("checkInStartDate", format(checkInStartDate, "yyyy-MM-dd"));
    }
    if (checkInEndDate) {
      set("checkInEndDate", format(checkInEndDate, "yyyy-MM-dd"));
    }
  };

  const applySessionDateRange = () => {
    if (sessionStartDate) {
      set("sessionStartDate", format(sessionStartDate, "yyyy-MM-dd"));
    }
    if (sessionEndDate) {
      set("sessionEndDate", format(sessionEndDate, "yyyy-MM-dd"));
    }
  };

  const handleUserSearch = (val) => {
    setUserSearchTerm(val);
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
                value={userSearchTerm}
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
              value={eventNameInput}
              onChange={(e) => setEventNameInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Event Type</Label>
            <Input
              placeholder="e.g., Conference, Workshop..."
              value={eventTypeInput}
              onChange={(e) => setEventTypeInput(e.target.value)}
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
              value={locationNameInput}
              onChange={(e) => setLocationNameInput(e.target.value)}
            />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">City</Label>
              <Input
                placeholder="e.g., Accra"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Country</Label>
              <Input
                placeholder="e.g., Ghana"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
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
                    !checkInStartDate && "text-muted-foreground"
                  )}
                >
                  {checkInStartDate
                    ? format(checkInStartDate, "MMM d, yyyy")
                    : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkInStartDate}
                  onSelect={setCheckInStartDate}
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
                    !checkInEndDate && "text-muted-foreground"
                  )}
                >
                  {checkInEndDate
                    ? format(checkInEndDate, "MMM d, yyyy")
                    : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkInEndDate}
                  onSelect={setCheckInEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={applyCheckInDateRange}
            disabled={!checkInStartDate && !checkInEndDate}
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
                    !sessionStartDate && "text-muted-foreground"
                  )}
                >
                  {sessionStartDate
                    ? format(sessionStartDate, "MMM d, yyyy")
                    : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sessionStartDate}
                  onSelect={setSessionStartDate}
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
                    !sessionEndDate && "text-muted-foreground"
                  )}
                >
                  {sessionEndDate
                    ? format(sessionEndDate, "MMM d, yyyy")
                    : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sessionEndDate}
                  onSelect={setSessionEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            onClick={applySessionDateRange}
            disabled={!sessionStartDate && !sessionEndDate}
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
