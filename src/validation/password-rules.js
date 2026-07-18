// src/validation/password-rules.js
import { z } from "zod";

/**
 * THE client-side password policy, mirroring the server's password-rules.js
 * so every surface that SETS a password (user creation, change password,
 * reset password) gives instant feedback instead of a server 400:
 * at least 8 characters with an uppercase letter, a lowercase letter,
 * and a digit. Login validation stays presence-only.
 */
export const passwordRule = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .max(255, "Password must be 255 characters or less")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");
