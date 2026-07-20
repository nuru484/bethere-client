// src/hooks/usePasswordReset.js
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "@/api/password-reset";
import { queryKeys } from "@/api/query-keys";

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: requestPasswordReset,
  });

// Validates the reset token when the reset page loads. Disabled until a token
// is present; no retries (deliberately overriding the global retry: 2) so an
// invalid/expired token surfaces immediately.
export const useVerifyResetToken = (token) =>
  useQuery({
    queryKey: queryKeys.passwordReset.verifyToken(token),
    queryFn: () => verifyResetToken(token),
    enabled: Boolean(token),
    retry: false,
    // Deliberately overriding the global staleTime: 5 minutes - token validity
    // is decided server-side and expires on a clock we do not control, so a
    // cached "valid" must never be reused. Always re-ask.
    staleTime: 0,
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: resetPassword,
  });
