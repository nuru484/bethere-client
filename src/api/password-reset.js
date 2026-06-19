// src/api/password-reset.js
import { api } from ".";

export const requestPasswordReset = async (data) =>
  await api.post("/password-reset/request", data);

// Backend reads the token from the query string on this endpoint.
export const verifyResetToken = async (token) =>
  await api.post("/password-reset/verify-reset-token", null, {
    params: { token },
  });

export const resetPassword = async (data) =>
  await api.post("/password-reset", data);
