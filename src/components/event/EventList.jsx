// src/components/events/EventList.jsx
import { useState, useEffect } from "react";
import EventListItem from "./EventListItem";
import EventListItemSkeleton from "./EventListItemSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, X, MapPin } from "lucide-react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import Pagination from "@/components/ui/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropTypes from "prop-types";

const EventList = ({
  data,
  isLoading,
  isError,
  error,
  meta,
  filters,
  onPageChange,
  onLimitChange,
  onFiltersChange,
  onRefetch,
  headerActions,
}) => {
  const [searchInput, setSearchInput] = useState(filters?.search || "");
  const [locationInput, setLocationInput] = useState(filters?.location || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters?.search) {
        onFiltersChange({ search: searchInput || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters?.search, onFiltersChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput !== filters?.location) {
        onFiltersChange({ location: locationInput || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput, filters?.location, onFiltersChange]);

  const handleClearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    onFiltersChange({
      search: undefined,
      type: undefined,
      location: undefined,
    });
  };

  const hasActiveFilters =
    filters?.search || filters?.type || filters?.location;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-6 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 sm:h-8 w-32 sm:w-40" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="max-w-5xl mx-auto space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Event List Item Skeletons */}
        <div className="max-w-5xl mx-auto space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <EventListItemSkeleton key={i} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = extractApiErrorMessage(error).message;
    return <ErrorMessage error={errorMessage} onRetry={onRefetch} />;
  }

  const eventCount = data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 sm:pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Events
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              {meta.total.toLocaleString()} event
              {meta.total !== 1 ? "s" : ""}{" "}
              {meta.total === 0 ? "available" : "found"}
            </p>
          </div>
        </div>

        {headerActions && (
          <div className="flex items-center gap-2 sm:gap-3">
            {headerActions}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title, description, type, or city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
            {/* Type Filter */}
            <Select
              value={filters?.type || "all"}
              onValueChange={(value) =>
                onFiltersChange({ type: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Seminar">Seminar</SelectItem>
                <SelectItem value="Meetup">Meetup</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Festival">Festival</SelectItem>
                <SelectItem value="Exhibition">Exhibition</SelectItem>
                <SelectItem value="Concert">Concert</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by location..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {locationInput && (
                <button
                  onClick={() => setLocationInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="whitespace-nowrap w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Event List */}
      {eventCount > 0 ? (
        <>
          <div className="space-y-4 max-w-5xl mx-auto">
            {data.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          <div className="max-w-5xl mx-auto">
            <Pagination
              meta={meta}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
              showPageSizeSelector={true}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12 sm:py-16">
          <div className="max-w-md mx-auto px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              No Events Found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {hasActiveFilters
                ? "No events match your current filters. Try adjusting your search criteria."
                : "No events available at the moment. Check back later."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

EventList.propTypes = {
  data: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  error: PropTypes.object,
  meta: PropTypes.shape({
    total: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.object,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onRefetch: PropTypes.func.isRequired,
  headerActions: PropTypes.node,
};

export default EventList;
