// src/components/attendance/venue-payload.js
//
// The venue display encodes each QR as `BETHERE1:<eventId>:<code>`. Parsing is
// kept dependency-free (no camera library) so it is unit-testable on its own.
export const QR_PREFIX = "BETHERE1";

/**
 * Validates a scanned QR payload against the event being checked into.
 * @returns {{ code: string } | { error: string }}
 */
export const parseVenuePayload = (text, expectedEventId) => {
  if (typeof text !== "string") return { error: "Unrecognized QR code." };

  const parts = text.trim().split(":");
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) {
    return { error: "That is not a BeThere venue code." };
  }

  const [, eventIdPart, code] = parts;
  if (String(expectedEventId) !== String(eventIdPart)) {
    return { error: "This code is for a different event." };
  }

  if (!code) return { error: "That venue code is incomplete." };

  return { code };
};
