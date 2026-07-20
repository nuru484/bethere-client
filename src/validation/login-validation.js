// src/validation/login-validation.js
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.email('Email must be a valid email address'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(255, 'Password must be 255 characters or less'),
});
