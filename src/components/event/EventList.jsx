// src/components/event/EventList.jsx
//
// Events index: mono eyebrow header, compact single-row search/filter bar
// (stacking on mobile), and a responsive grid of card links.
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import PropTypes from "prop-types";
import EventListItem from "./EventListItem";
import EventListItemSkeleton from "./EventListItemSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import Pagination from "@/components/ui/Pagination";
import { normalizeFilterValue } from "@/lib/filter-value";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MICRO_LABEL =
  "font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground";

const EVENT_TYPES = [
  "Conference",
  "Workshop",
  "Seminar",
  "Meetup",
  "Webinar",
  "Festival",
  "Exhibition",
  "Concert",
  "Sports",
  "Other",
];

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
  const debouncedSearch = useDebounce(searchInput, 500);

  // Normalize both sides: an empty box is "" while an absent URL filter is
  // undefined, and comparing those raw made this fire 500ms after every mount,
  // which reset the list to page 1 (see src/lib/filter-value.js).
  useEffect(() => {
    if (
      normalizeFilterValue(debouncedSearch) !==
      normalizeFilterValue(filters?.search)
    ) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters?.search, onFiltersChange]);

  const handleClearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      search: undefined,
      type: undefined,
    });
  };

  const hasActiveFilters = Boolean(filters?.search || filters?.type);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-end justify-between gap-4 border-b pb-4 sm:pb-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-32 sm:h-9" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* Filter row skeleton */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex-none space-y-1.5 lg:w-40">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-9 w-full lg:w-40" />
          </div>
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventListItemSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
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
  const noEventsAtAll = meta.total === 0 && !hasActiveFilters;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header: mono eyebrow + display title (the count lives in the
          toolbar area below, never here) */}
      <div className="flex items-end justify-between gap-4 border-b pb-4 sm:pb-6">
        <div className="min-w-0">
          <p className={MICRO_LABEL}>All events</p>
          <h1 className="mt-1 font-display text-2xl font-normal tracking-[-0.02em] text-foreground sm:text-3xl">
            Events
          </h1>
        </div>

        {headerActions && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {headerActions}
          </div>
        )}
      </div>

      {/* Compact search/filter row + result count - hidden when there is
          nothing to search or filter at all */}
      {!noEventsAtAll && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            {/* Search */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <label htmlFor="event-search" className={MICRO_LABEL}>
                Search
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <Input
                  id="event-search"
                  type="text"
                  placeholder="Search title, type or location"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Type filter + clear */}
            <div className="flex flex-none items-end gap-3">
              <div className="flex-1 space-y-1.5 lg:w-40 lg:flex-none">
                <span className={MICRO_LABEL}>Type</span>
                <Select
                  value={filters?.type || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      type: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Result count - the single place the total appears */}
          <p className={MICRO_LABEL}>{meta.total.toLocaleString()} total</p>
        </div>
      )}

      {/* Event grid */}
      {eventCount > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>

          <Pagination
            meta={meta}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            showPageSizeSelector={true}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </>
      ) : noEventsAtAll ? (
        <EmptyState
          eyebrow="Events"
          title="No events yet"
          description="Events will appear here once they are created."
        />
      ) : (
        <div className="rounded-2xl border border-dashed py-12 text-center sm:py-16">
          <div className="mx-auto max-w-md px-4">
            <p className="text-sm text-muted-foreground">
              No events match the current filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear filters
            </Button>
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
