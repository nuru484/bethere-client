// src/pages/CreateEventPage.jsx
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EventForm from "@/components/event/EventForm";
import { Button } from "@/components/ui/button";
import { useCreateEvent } from "@/hooks/useEvent";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { eventValidationSchema } from "@/validation/eventValidation";
import { buildEventPayload } from "@/components/event/event-payload";

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { mutate: createEvent, isPending } = useCreateEvent();

  const defaultValues = useMemo(
    () => ({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      isRecurring: false,
      recurrenceInterval: undefined,
      durationDays: undefined,
      type: "",
      coverImage: undefined,
      location: {
        name: "",
        city: "",
        country: "",
      },
    }),
    []
  );

  const form = useForm({
    resolver: zodResolver(eventValidationSchema),
    defaultValues,
  });

  const handleSubmit = (data) => {
    createEvent(buildEventPayload(data), {
      onSuccess: (response) => {
        toast.success(response.message || "Event created successfully!");
        navigate("/dashboard/events");
      },
      onError: (err) => {
        console.error("Event creation error:", err);

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
          toast.error(message || "Failed to create event. Please try again.");
        }
      },
    });
  };

  const handleGoBack = () => {
    navigate("/dashboard/events");
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header: mono eyebrow + display title */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            New event
          </p>
          <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
            Create Event
          </h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
            Fill in the details to create a new event
          </p>
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

      <EventForm
        form={form}
        onSubmit={handleSubmit}
        isLoading={isPending}
        mode="create"
      />
    </div>
  );
};

export default CreateEventPage;
