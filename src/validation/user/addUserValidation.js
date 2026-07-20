import { z } from "zod";
import { passwordRule } from "@/validation/password-rules";

// Attendant creation is passwordless: POST /users rejects a password field.
// Attendants sign in via the one-time-code (OTP) flow instead.
export const addUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().optional().nullable(),
});

// Admins still authenticate with email + password.
export const addAdminSchema = addUserSchema.extend({
  password: passwordRule,
});
