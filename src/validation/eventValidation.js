// src/validation/eventValidation.js
import { z } from "zod";

// Post-compression ceiling, mirrored by the Zod rule and the helper text in
// EventForm. The raw-file guard before compression is larger (see EventForm).
export const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;

export const eventValidationSchema = z
  .object({
    title: z
      .string()
      .min(1, "Event title is required")
      .max(255, "Event title must not exceed 255 characters")
      .trim(),

    description: z
      .string()
      .max(500, "Event description must not exceed 500 characters")
      .trim()
      .optional(),

    startDate: z
      .string()
      .min(1, "Event start date is required")
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date",
      }),

    endDate: z
      .string()
      .optional()
      .refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "End date must be a valid date",
      }),

    // Two-digit hours on purpose: times are compared as strings downstream,
    // and "9:00" would sort after "19:30" lexically.
    startTime: z
      .string()
      .min(1, "Start time is required")
      .regex(
        /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
        "Start time must be in HH:MM format (e.g., 06:00)"
      ),

    endTime: z
      .string()
      .min(1, "End time is required")
      .regex(
        /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
        "End time must be in HH:MM format (e.g., 19:30)"
      ),

    isRecurring: z.boolean().optional().default(false),

    recurrenceInterval: z
      .number()
      .int()
      .min(1, "Recurrence interval must be a positive integer")
      .optional(),

    durationDays: z
      .number()
      .int()
      .min(1, "Duration days must be a positive integer")
      .optional(),

    type: z.string().min(1, "Event type is required").trim(),

    // Cover image field semantics (multipart contract):
    // undefined = leave unchanged, "" = remove, File = upload/replace.
    coverImage: z
      .any()
      .optional()
      .refine((file) => file === undefined || file === "" || file instanceof File, {
        message: "Cover image must be a file",
      })
      .refine(
        (file) => !(file instanceof File) || file.type.startsWith("image/"),
        { message: "Cover image must be an image file (PNG, JPG or WebP)." }
      )
      .refine(
        (file) => !(file instanceof File) || file.size <= MAX_COVER_IMAGE_BYTES,
        { message: "Cover image must be 5MB or smaller." }
      ),

    location: z.object({
      name: z
        .string()
        .min(1, "Location name is required")
        .max(255, "Location name must not exceed 255 characters")
        .trim(),

      city: z
        .string()
        .max(100, "City name must not exceed 100 characters")
        .trim()
        .optional(),

      country: z
        .string()
        .max(100, "Country name must not exceed 100 characters")
        .trim()
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (!data.isRecurring && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required for non-recurring events",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const start = Date.parse(data.startDate);
      const end = Date.parse(data.endDate);
      if (isNaN(start) || isNaN(end)) return true;
      return end >= start;
    },
    {
      message: "End date cannot be before the start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // Only single-day sessions need endTime after startTime; a multi-day
      // session (durationDays > 1) legitimately ends on a later day at an
      // earlier clock time. Two-digit HH:MM makes the string compare safe.
      const spansDays = (data.durationDays ?? 1) > 1;
      if (spansDays || !data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after the start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      // Server rule: a recurrence cannot be shorter than the sessions it
      // spawns, or sessions would overlap.
      if (!data.isRecurring) return true;
      if (!data.recurrenceInterval || !data.durationDays) return true;
      return data.recurrenceInterval >= data.durationDays;
    },
    {
      message:
        "Recurrence interval must be at least the session duration in days",
      path: ["recurrenceInterval"],
    }
  );
