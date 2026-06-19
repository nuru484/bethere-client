// src/hooks/usePasswordReset.js
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "@/api/password-reset";

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: requestPasswordReset,
  });

// Validates the reset token when the reset page loads. Disabled until a token
// is present; no retries so an invalid/expired token surfaces immediately.
export const useVerifyResetToken = (token) =>
  useQuery({
    queryKey: ["verify-reset-token", token],
    queryFn: () => verifyResetToken(token),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: resetPassword,
  });
