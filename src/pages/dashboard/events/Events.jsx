// src/pages/EventsPage.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useGetEvents } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import EventList from "@/components/event/EventList";

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    search: undefined,
    type: undefined,
    location: undefined,
  });

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

  const handlePageChange = (newPage) => setPage(newPage);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1);
  }, []);

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
            <Button
              onClick={handleCreateEvent}
              size="sm"
              className="flex-1 sm:flex-none gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Create Event</span>
              <span className="xs:hidden">Create</span>
            </Button>
          )
        }
      />
    </div>
  );
}
