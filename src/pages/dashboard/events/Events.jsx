// src/pages/EventsPage.jsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGetEvents } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";
import EventList from "@/components/event/EventList";

// Filter fields this page owns (stable identity for the URL-state hook).
const FILTER_KEYS = ["search", "type"];

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Page, page size and filters live in the URL so refresh/back/share keep
  // the same view.
  const {
    page,
    pageSize: limit,
    filters,
    setPage,
    setPageSize,
    setFilters,
  } = usePaginatedListState({ filterKeys: FILTER_KEYS });

  const {
    data: eventsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvents({
    page,
    limit,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    ),
  });

  // setPageSize and setFilters already reset the page to 1.
  const handlePageChange = setPage;
  const handleLimitChange = setPageSize;
  const handleFiltersChange = setFilters;

  const handleCreateEvent = () => {
    navigate("/dashboard/events/create");
  };

  return (
    <div className="container mx-auto space-y-6">
      <EventList
        data={eventsData?.data || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        meta={
          eventsData?.meta || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          }
        }
        filters={filters}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onFiltersChange={handleFiltersChange}
        onRefetch={refetch}
        headerActions={
          isAdmin && (
            <Button onClick={handleCreateEvent} size="sm">
              Create event
            </Button>
          )
        }
      />
    </div>
  );
}
