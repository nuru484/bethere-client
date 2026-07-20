// src/hooks/useFrameCapture.js
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Lightweight webcam frame-burst capture for server-side liveness enrollment
 * and check-in.
 *
 * This does NO client-side face detection - it just streams the camera and
 * grabs a burst of JPEG blobs. The server verifies liveness/identity across the
 * whole burst and derives the face template from it.
 *
 * @param {object} opts
 * @param {number} [opts.frameCount=11]  number of frames to capture in the burst
 * @param {number} [opts.intervalMs=450] delay between frames (~5s total for 11)
 * @param {(blobs: Blob[]) => void} [opts.onComplete] called with captured blobs
 */
export const useFrameCapture = ({
  frameCount = 11,
  intervalMs = 450,
  onComplete,
} = {}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const blobsRef = useRef([]);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  // Bumped whenever the camera or a burst is torn down, so work that was
  // already in flight (the getUserMedia prompt, an awaited toBlob) can tell it
  // belongs to a dead session and bail out instead of resurrecting itself.
  const cameraSessionRef = useRef(0);
  const captureSessionRef = useRef(0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopCamera = useCallback(() => {
    cameraSessionRef.current += 1;
    captureSessionRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setIsCapturing(false);
  }, []);

  const startCamera = useCallback(async () => {
    const session = ++cameraSessionRef.current;
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      // Unmounted / restarted while the permission prompt was up: release the
      // stream nobody is left to stop.
      if (session !== cameraSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      let message = "Unable to access the camera. Please try again.";
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        message =
          "Camera access was denied. Please allow camera permission in your browser settings and try again.";
      } else if (err?.name === "NotFoundError") {
        message = "No camera was found on this device.";
      } else if (err?.name === "NotReadableError") {
        message =
          "The camera is already in use by another app. Close it and try again.";
      }
      if (session !== cameraSessionRef.current) return;
      setCameraError(message);
    }
  }, []);

  // Start the camera on mount and always release it on unmount.
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.resolve(null);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }, []);

  const startCapture = useCallback(() => {
    if (!cameraReady || isCapturing) return;

    const session = ++captureSessionRef.current;

    blobsRef.current = [];
    setCapturedCount(0);
    setIsCapturing(true);

    const grabNext = async (index) => {
      const blob = await captureFrame();
      // Torn down mid-frame: don't re-arm the timer cleanup just cleared and
      // don't hand a half-finished burst to onComplete.
      if (session !== captureSessionRef.current) return;
      if (blob) {
        blobsRef.current.push(blob);
        setCapturedCount(blobsRef.current.length);
      }

      if (index + 1 < frameCount) {
        timerRef.current = setTimeout(() => grabNext(index + 1), intervalMs);
      } else {
        timerRef.current = null;
        setIsCapturing(false);
        onCompleteRef.current?.(blobsRef.current);
      }
    };

    grabNext(0);
  }, [cameraReady, isCapturing, captureFrame, frameCount, intervalMs]);

  const retryCamera = useCallback(() => {
    stopCamera();
    startCamera();
  }, [stopCamera, startCamera]);

  const progress = frameCount > 0 ? capturedCount / frameCount : 0;

  return {
    videoRef,
    cameraReady,
    cameraError,
    isCapturing,
    capturedCount,
    frameCount,
    progress,
    startCapture,
    retryCamera,
    stopCamera,
  };
};
