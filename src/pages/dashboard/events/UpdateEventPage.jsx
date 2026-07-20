// src/pages/UpdateEventPage.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EventForm from "@/components/event/EventForm";
import EventFormSkeleton from "@/components/event/EventFormSkeleton";
import { Button } from "@/components/ui/button";
import { useUpdateEvent, useGetEvent } from "@/hooks/useEvent";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { eventValidationSchema } from "@/validation/eventValidation";
import { buildEventPayload } from "@/components/event/event-payload";
import { usePageTitle } from "@/hooks/usePageTitle";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";

const UpdateEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  usePageTitle("Update Event");

  const {
    data: eventData,
    isLoading: isFetchingEvent,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useGetEvent(eventId);

  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const defaultValues = useMemo(() => {
    if (!eventData?.data) return null;

    return {
      title: eventData.data.title,
      description: eventData.data.description || "",
      startDate: eventData.data.startDate
        ? new Date(eventData.data.startDate).toISOString().split("T")[0]
        : "",
      endDate: eventData.data.endDate
        ? new Date(eventData.data.endDate).toISOString().split("T")[0]
        : "",
      startTime: eventData.data.startTime,
      endTime: eventData.data.endTime,
      isRecurring: eventData.data.isRecurring,
      recurrenceInterval: eventData.data.recurrenceInterval || undefined,
      durationDays: eventData.data.durationDays || undefined,
      type: eventData.data.type,
      // undefined = leave the stored cover image unchanged on submit.
      coverImage: undefined,
      location: {
        name: eventData.data.location?.name || "",
        city: eventData.data.location?.city || "",
        country: eventData.data.location?.country || "",
      },
    };
  }, [eventData]);

  const form = useForm({
    resolver: zodResolver(eventValidationSchema),
    values: defaultValues || undefined,
  });

  const handleSubmit = (data) => {
    updateEvent(
      { eventId, data: buildEventPayload(data) },
      {
        onSuccess: (response) => {
          toast.success(response.message || "Event updated successfully!");
          navigate(`/dashboard/events/${eventId}`);
        },
        onError: (err) => {
          console.error("Event update error:", err);

          const { message, fieldErrors, hasFieldErrors } =
            extractApiErrorMessage(err);

          if (hasFieldErrors && fieldErrors) {
            Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
              form.setError(field, {
                message: errorMessage,
              });
            });
            toast.error(message);
          } else {
            toast.error(message || "Failed to update event. Please try again.");
          }
        },
      }
    );
  };

  const handleGoBack = () => {
    navigate("/dashboard/events");
  };

  // Error state
  if (isFetchError) {
    const { message } = extractApiErrorMessage(fetchError);
    return <ErrorMessage error={message} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header: mono eyebrow + display title + event name caption */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            Editing
          </p>
          <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
            Update Event
          </h1>
          {isFetchingEvent ? (
            <Skeleton className="mt-2 h-4 w-48" />
          ) : (
            <p className="mt-1 break-words text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              {eventData?.data?.title}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={handleGoBack}
        >
          Back
        </Button>
      </div>

      {isFetchingEvent ? (
        <EventFormSkeleton />
      ) : (
        <EventForm
          form={form}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
          mode="update"
          cancelPath={`/dashboard/events/${eventId}`}
          initialCoverImage={eventData?.data?.coverImage || null}
        />
      )}
    </div>
  );
};

export default UpdateEventPage;
