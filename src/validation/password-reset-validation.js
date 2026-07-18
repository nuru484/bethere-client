// src/validation/password-reset-validation.js
import { z } from "zod";
import { passwordRule } from "@/validation/password-rules";

// Mirrors the backend requestPasswordResetValidation (email required & valid).
export const forgotPasswordSchema = z.object({
  email: z.email("Email must be a valid email address"),
});

// Mirrors the backend resetPasswordValidation: the shared password policy
// applies to newPassword, and the confirmation must match (the server
// enforces this too).
export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
