// src/validation/phone-rule.js
import { z } from "zod";

// Client-side approximation of the server's isMobilePhone check (E.164-ish:
// optional +, 7-15 digits, common separators tolerated). The server remains
// authoritative - this only catches obvious typos before a round trip.
const PHONE_PATTERN = /^\+?\d{7,15}$/;

export const optionalPhoneRule = z
  .string()
  .optional()
  .nullable()
  .refine(
    (value) =>
      !value || PHONE_PATTERN.test(value.replace(/[\s\-().]/g, "")),
    { message: "Enter a valid phone number (e.g. +233201234567)" }
  );
