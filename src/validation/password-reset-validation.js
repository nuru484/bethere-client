// src/validation/password-reset-validation.js
import { z } from "zod";

// Mirrors the backend requestPasswordResetValidation (email required & valid).
export const forgotPasswordSchema = z.object({
  email: z.email("Email must be a valid email address"),
});

// Mirrors the backend resetPasswordValidation: newPassword min 8, and the
// confirmation must match (the server enforces this too).
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(255, "Password must be 255 characters or less"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
