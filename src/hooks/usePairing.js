// src/hooks/usePairing.js
import { useMutation, useQuery } from "@tanstack/react-query";
import { startPairing, getPairingStatus } from "@/api/pairing";

// Laptop: start a pairing (single-use, so a plain mutation).
export const useStartPairing = () =>
  useMutation({
    mutationFn: ({ scope, eventId, mode }) =>
      startPairing({ scope, eventId, mode }),
  });

// Laptop: poll a pairing until the phone finishes. Enabled only while a pairing
// is live; polling stops once it is no longer PENDING.
export const usePairingStatus = (pairingId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ["pairing", pairingId],
    queryFn: () => getPairingStatus(pairingId),
    enabled: Boolean(pairingId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status && status !== "PENDING" ? false : 2000;
    },
    staleTime: 0,
    gcTime: 0,
  });
