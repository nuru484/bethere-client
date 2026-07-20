// src/validation/user/profileValidation.js
import { z } from "zod";
import { passwordRule } from "@/validation/password-rules";
import { optionalPhoneRule } from "@/validation/phone-rule";

// Length limits mirror the server's update rules (min 2, max 100).
export const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name must not exceed 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name must not exceed 100 characters"),
  email: z.string().email("Invalid email address"),
  phone: optionalPhoneRule,
});

// Passwordless (OTP-only) accounts can set a first password without providing
// a current one, so the current-password requirement is conditional.
export const buildPasswordSchema = (requireCurrentPassword = true) =>
  z
    .object({
      currentPassword: requireCurrentPassword
        ? z.string().min(1, "Current password is required")
        : z.string().optional(),
      newPassword: passwordRule,
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

export const passwordSchema = buildPasswordSchema(true);
