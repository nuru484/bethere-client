// src/components/event/EventFormSkeleton.jsx
//
// Mirrors EventForm: numbered mono eyebrow + title per section, then the
// section's fields. No icons - the form language is text-only.
import { Skeleton } from "@/components/ui/skeleton";
import PropTypes from "prop-types";

const SectionHeader = ({ index, title }) => (
  <div className="mb-6">
    <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
      {index}
    </p>
    <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

SectionHeader.propTypes = {
  index: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

const EventFormSkeleton = () => {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Basic Information Section */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
        <SectionHeader index="01" title="Basic Information" />

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[100px] w-full" />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
        <SectionHeader index="02" title="Cover Image" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      {/* Date and Time Section */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
        <SectionHeader index="03" title="Date & Time" />

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Time */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Event Section */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
        <SectionHeader index="04" title="Recurrence Settings" />

        <div className="space-y-6">
          {/* Checkbox */}
          <div className="flex items-start space-x-3">
            <Skeleton className="h-4 w-4 rounded mt-1" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
        <SectionHeader index="05" title="Event Location" />

        <div className="space-y-6">
          {/* Location Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Skeleton className="flex-1 h-11 rounded-lg" />
        <Skeleton className="flex-1 h-11 rounded-full" />
      </div>
    </div>
  );
};

export default EventFormSkeleton;
