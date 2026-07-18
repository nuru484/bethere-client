import { describe, it, expect } from "vitest";
import {
  euclideanDistance,
  compareDescriptors,
  DESCRIPTOR_LENGTH,
  DEFAULT_DISTANCE_THRESHOLD,
} from "@/lib/face-math";

const zeros = () => new Array(DESCRIPTOR_LENGTH).fill(0);

describe("face-math", () => {
  describe("euclideanDistance", () => {
    it("is zero for identical vectors", () => {
      const a = Array.from({ length: DESCRIPTOR_LENGTH }, (_, i) => i / 100);
      expect(euclideanDistance(a, [...a])).toBe(0);
    });

    it("computes the expected distance", () => {
      // Every component differs by 0.1: sqrt(128 * 0.01) = sqrt(1.28)
      const a = zeros();
      const b = new Array(DESCRIPTOR_LENGTH).fill(0.1);
      expect(euclideanDistance(a, b)).toBeCloseTo(Math.sqrt(1.28), 10);
    });

    it("throws on missing or mismatched-length vectors", () => {
      expect(() => euclideanDistance(null, zeros())).toThrow();
      expect(() => euclideanDistance(zeros(), [0, 1, 2])).toThrow();
    });
  });

  describe("compareDescriptors", () => {
    it("matches identical vectors", () => {
      const a = Array.from({ length: DESCRIPTOR_LENGTH }, (_, i) => i / 200);
      const { isMatch, distance } = compareDescriptors(a, [...a]);
      expect(isMatch).toBe(true);
      expect(distance).toBe(0);
    });

    it("does not match distant vectors", () => {
      const a = zeros();
      const b = new Array(DESCRIPTOR_LENGTH).fill(0.1); // distance ~1.13
      const { isMatch, distance } = compareDescriptors(a, b);
      expect(isMatch).toBe(false);
      expect(distance).toBeGreaterThan(DEFAULT_DISTANCE_THRESHOLD);
    });

    it("treats a distance exactly at the threshold as a match", () => {
      const a = zeros();
      const b = zeros();
      b[0] = DEFAULT_DISTANCE_THRESHOLD; // distance is exactly 0.6
      const { isMatch, distance } = compareDescriptors(a, b);
      expect(distance).toBeCloseTo(DEFAULT_DISTANCE_THRESHOLD, 10);
      expect(isMatch).toBe(true);
    });

    it("rejects a distance just above the threshold", () => {
      const a = zeros();
      const b = zeros();
      b[0] = DEFAULT_DISTANCE_THRESHOLD + 0.0001;
      expect(compareDescriptors(a, b).isMatch).toBe(false);
    });

    it("honors a custom threshold", () => {
      const a = zeros();
      const b = zeros();
      b[0] = 0.5;
      expect(compareDescriptors(a, b, 0.4).isMatch).toBe(false);
      expect(compareDescriptors(a, b, 0.6).isMatch).toBe(true);
    });
  });
});
