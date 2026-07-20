import { describe, it, expect } from "vitest";
import { compressImage } from "./compress-image";

// jsdom implements neither createImageBitmap nor canvas.toBlob, so these tests
// exercise the ROBUSTNESS contract: compression must never throw and must fall
// back to the original file rather than block an upload.
describe("compressImage", () => {
  it("falls back to the original when the image cannot be decoded", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "photo.png", {
      type: "image/png",
    });
    const out = await compressImage(file);
    // Undecodable in jsdom -> returns the exact input, never throws.
    expect(out).toBe(file);
  });

  it("never rejects on a bad input", async () => {
    await expect(compressImage(new Blob(["x"]))).resolves.toBeDefined();
  });
});
