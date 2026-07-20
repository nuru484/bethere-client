// src/validation/login-validation.js
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.email('Email must be a valid email address'),
  // Presence-only on purpose: composition rules (passwordRule) apply where
  // passwords are SET; enforcing them at login would lock out legacy passwords.
  password: z
    .string()
    .min(1, 'Password is required')
    .max(255, 'Password must be 255 characters or less'),
});
