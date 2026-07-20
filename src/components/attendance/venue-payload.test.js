import { describe, it, expect } from "vitest";
import { parseVenuePayload } from "./venue-payload";

describe("parseVenuePayload", () => {
  it("extracts the code for a valid payload matching the event", () => {
    expect(parseVenuePayload("BETHERE1:42:a1b2c3d4e5f60718", 42)).toEqual({
      code: "a1b2c3d4e5f60718",
    });
    // eventId compared as strings, so a numeric or string id both match.
    expect(parseVenuePayload("BETHERE1:42:a1b2c3d4e5f60718", "42")).toEqual({
      code: "a1b2c3d4e5f60718",
    });
  });

  it("rejects a non-BeThere payload", () => {
    expect(parseVenuePayload("just-some-qr", 42).error).toBeTruthy();
    expect(parseVenuePayload("OTHER:42:abc", 42).error).toBeTruthy();
    expect(parseVenuePayload("BETHERE1:42", 42).error).toBeTruthy(); // too few parts
  });

  it("rejects a code minted for a different event", () => {
    const res = parseVenuePayload("BETHERE1:99:abcdef1234567890", 42);
    expect(res.error).toMatch(/different event/i);
    expect(res.code).toBeUndefined();
  });

  it("rejects an incomplete code and non-string input", () => {
    expect(parseVenuePayload("BETHERE1:42:", 42).error).toBeTruthy();
    expect(parseVenuePayload(null, 42).error).toBeTruthy();
    expect(parseVenuePayload(undefined, 42).error).toBeTruthy();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseVenuePayload("  BETHERE1:7:deadbeefdeadbeef  ", 7)).toEqual({
      code: "deadbeefdeadbeef",
    });
  });
});
