// src/lib/camera-errors.js
//
// Maps a getUserMedia DOMException to user-facing guidance. Shared by the QR
// scanner and the liveness frame capture so both surfaces explain a camera
// failure the same way.
export const cameraErrorMessage = (err) => {
  if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
    return "Camera access was denied. Please allow camera permission in your browser settings and try again.";
  }
  if (err?.name === "NotFoundError") {
    return "No camera was found on this device.";
  }
  if (err?.name === "NotReadableError") {
    return "The camera is already in use by another app. Close it and try again.";
  }
  return "Unable to access the camera. Please try again.";
};
