// src/components/event/EventForm.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Info, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import SectionHeader from "@/components/ui/FormSectionHeader";
import { compressImage } from "@/lib/compress-image";

// Pre-compression ceiling for the raw file picked from disk. The compressed
// result is validated against MAX_COVER_IMAGE_BYTES (5MB, eventValidation.js),
// which the helper text mirrors.
const MAX_RAW_COVER_IMAGE_BYTES = 25 * 1024 * 1024;

const EventForm = ({
  form,
  onSubmit,
  isLoading,
  mode = "create",
  cancelPath = "/dashboard/events",
  initialCoverImage = null,
}) => {
  const navigate = useNavigate();
  const [coverObjectUrl, setCoverObjectUrl] = useState(null);
  const coverInputRef = useRef(null);
  const isRecurring = form.watch("isRecurring");
  const coverValue = form.watch("coverImage");

  // Live preview for a freshly selected file; revoked on change/unmount.
  useEffect(() => {
    if (coverValue instanceof File) {
      const url = URL.createObjectURL(coverValue);
      setCoverObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverObjectUrl(null);
  }, [coverValue]);

  // coverImage field semantics: undefined = unchanged, "" = remove,
  // File = replace. Preview resolves in that order.
  const coverPreviewUrl =
    coverValue instanceof File
      ? coverObjectUrl
      : coverValue === ""
        ? null
        : initialCoverImage;

  const handleCoverChange = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      form.setError("coverImage", {
        type: "manual",
        message: "Cover image must be an image file (PNG, JPG or WebP).",
      });
      e.target.value = "";
      return;
    }

    // Only guard absurdly large originals; the image is compressed below, so a
    // normal multi-MB photo uploads as a couple hundred KB.
    if (file.size > MAX_RAW_COVER_IMAGE_BYTES) {
      form.setError("coverImage", {
        type: "manual",
        message: "Cover image is too large. Please choose one under 25MB.",
      });
      e.target.value = "";
      return;
    }

    form.clearErrors("coverImage");
    const compressed = await compressImage(file, {
      maxDimension: 1600,
      quality: 0.82,
      fileName: `${(file.name || "cover").replace(/\.[^.]+$/, "")}.jpg`,
    });
    field.onChange(compressed);
  };

  const handleRemoveCover = (field) => {
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
    form.clearErrors("coverImage");

    if (coverValue instanceof File) {
      // Drop the selection; an existing image (if any) shows again.
      field.onChange(undefined);
    } else {
      // Mark the existing image for removal (sent as "").
      field.onChange("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {/* Basic Information Section */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <SectionHeader index="01" title="Basic Information" />

            <div className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event title"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter event description"
                        {...field}
                        disabled={isLoading}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Sports, Music, Conference"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <SectionHeader index="02" title="Cover Image" />

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cover image{" "}
                    <span className="text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isLoading}
                      onChange={(e) => handleCoverChange(e, field)}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown on the event card and detail page. PNG, JPG or WebP.
                    Large photos are compressed automatically; the compressed
                    image must be under 5MB.
                  </FormDescription>
                  <FormMessage />

                  {coverPreviewUrl && (
                    <div className="space-y-2 pt-2">
                      <img
                        src={coverPreviewUrl}
                        alt="Cover image preview"
                        className="aspect-video w-full rounded-xl border border-border object-cover"
                      />
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleRemoveCover(field)}
                        className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Date and Time Section */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <SectionHeader index="03" title="Date & Time" />

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        End Date
                        {!isRecurring && (
                          <span className="text-destructive text-xs">
                            (Required)
                          </span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info
                              size={14}
                              strokeWidth={1.5}
                              className="text-muted-foreground cursor-help"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {isRecurring
                              ? "Optional for recurring events"
                              : "Required for non-recurring events"}
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        When attendance opens (e.g., 06:00)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Time */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        When attendance closes (e.g., 19:30)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Recurring Event Section */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <SectionHeader index="04" title="Recurrence Settings" />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        Is this event recurring?
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info
                              size={14}
                              strokeWidth={1.5}
                              className="text-muted-foreground cursor-help"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            If enabled, the event will repeat at regular
                            intervals
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormDescription>
                        Enable this if the event repeats over time
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="recurrenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Interval (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 7 for weekly"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            value={field.value || ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          How many days between occurrences
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                            value={field.value || ""}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          How many days each occurrence lasts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
            <SectionHeader index="05" title="Event Location" />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="location.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Conference Hall A"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Accra"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ghana"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(cancelPath)}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading} className="flex-1 h-11">
              {isLoading && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  strokeWidth={1.5}
                />
              )}
              {mode === "update" ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

EventForm.propTypes = {
  form: PropTypes.shape({
    control: PropTypes.any.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    watch: PropTypes.func.isRequired,
    setError: PropTypes.func.isRequired,
    clearErrors: PropTypes.func.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  mode: PropTypes.oneOf(["create", "update"]),
  cancelPath: PropTypes.string,
  initialCoverImage: PropTypes.string,
};

export default EventForm;
