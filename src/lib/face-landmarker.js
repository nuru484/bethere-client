// src/lib/face-landmarker.js
//
// Lazy singleton around MediaPipe's FaceLandmarker for ON-DEVICE gesture
// gating only: it decides when the user has performed a prompted action so
// the right frames get captured. It is NOT the verifier - the server
// recomputes identity and liveness from the raw frames and trusts nothing
// this model says.
//
// All assets (wasm runtime + .task model) are self-hosted under
// public/models/mediapipe/ because the production CSP only allows same-origin
// fetches. The wasm runtime additionally needs 'wasm-unsafe-eval' in
// script-src (set in vercel.json).
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const WASM_BASE = "/models/mediapipe/wasm";
const MODEL_PATH = "/models/mediapipe/face_landmarker.task";

let instancePromise = null;

const createLandmarker = async (delegate) => {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO",
    numFaces: 2,
    // Blendshapes carry the smile/blink scores; the landmark geometry carries
    // the head-turn proxy. numFaces: 2 lets us detect (and refuse) a second
    // face in frame instead of silently tracking the wrong one.
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
};

/**
 * Load (or reuse) the shared FaceLandmarker. GPU delegate first - it is far
 * faster on phones - falling back to CPU where WebGL is unavailable or the
 * GPU init throws. Failures clear the cached promise so a retry can succeed.
 */
export const loadFaceLandmarker = () => {
  if (!instancePromise) {
    instancePromise = (async () => {
      try {
        return await createLandmarker("GPU");
      } catch {
        return await createLandmarker("CPU");
      }
    })().catch((error) => {
      instancePromise = null;
      throw error;
    });
  }
  return instancePromise;
};

/**
 * Fire-and-forget warm-up. Call from the consent/scan screens so the model
 * and wasm are ready BEFORE the single-use, short-TTL challenge is minted -
 * model download time must not eat into the challenge window.
 */
export const preloadFaceLandmarker = () => {
  loadFaceLandmarker().catch(() => undefined);
};
