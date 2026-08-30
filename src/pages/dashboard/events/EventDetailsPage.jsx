// src/pages/dashboard/events/EventDetails.jsx
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteEvent, useGetEvent } from "@/hooks/useEvent";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/ui/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import EventDetails from "@/components/event/EventDetails";
import EventActionsSidebar from "@/components/event/EventActionsSidebar";
import toast from "react-hot-toast";

const EventDetailsPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuth();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const {
    data: eventData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);

  // The detail response embeds currentSession + viewerAttendance for
  // attendants, so the sidebar needs no separate attendance fetch.
  const event = eventData?.data;

  const handleDelete = () => {
    deleteEvent(
      { eventId },
      {
        onSuccess: (response) => {
          toast.success(response.message || "Event deleted successfully");
          navigate("/dashboard/events");
        },
        onError: (error) => {
          const { message } = extractApiErrorMessage(error);
          toast.error(message || "Failed to deleted event");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="max-w-7xl mx-auto flex items-start gap-2 sm:gap-3 pb-4 sm:pb-6 border-b">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = extractApiErrorMessage(error).message;
    return <ErrorMessage error={errorMessage} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header: mono eyebrow, back control beside the display title */}
      <div className="max-w-7xl mx-auto flex items-start gap-2 pb-4 sm:gap-3 sm:pb-6 border-b">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            Event
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2 sm:gap-3">
            <BackButton to="/dashboard/events" label="Back to events" />
            <h1 className="min-w-0 line-clamp-2 break-words font-display text-xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-2xl lg:text-3xl">
              {event?.title || "Event Details"}
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
            View event information and details
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <EventDetails event={event} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <EventActionsSidebar
                event={event}
                user={user}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
