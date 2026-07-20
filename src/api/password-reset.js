// src/api/password-reset.js
import { api } from ".";

export const requestPasswordReset = async (data) =>
  await api.post("/password-reset/request", data);

// Backend now reads the token from the request body on this endpoint.
export const verifyResetToken = async (token) =>
  await api.post("/password-reset/verify-reset-token", { token });

export const resetPassword = async (data) =>
  await api.post("/password-reset", data);
