// src/lib/face-math.js
// Pure face descriptor math, kept free of face-api.js so it can be
// used and tested without loading detection models or a camera.

export const DESCRIPTOR_LENGTH = 128;
export const DEFAULT_DISTANCE_THRESHOLD = 0.6;

/**
 * Euclidean distance between two equal-length numeric vectors.
 * @param {ArrayLike<number>} a
 * @param {ArrayLike<number>} b
 * @returns {number}
 */
export const euclideanDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    throw new Error("Vectors must be defined and of equal length");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Compares two face descriptors.
 * @param {ArrayLike<number>} descriptor1
 * @param {ArrayLike<number>} descriptor2
 * @param {number} threshold - maximum distance considered a match
 * @returns {{ isMatch: boolean, distance: number }}
 */
export const compareDescriptors = (
  descriptor1,
  descriptor2,
  threshold = DEFAULT_DISTANCE_THRESHOLD
) => {
  const distance = euclideanDistance(descriptor1, descriptor2);
  return { isMatch: distance <= threshold, distance };
};
