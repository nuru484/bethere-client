// src/hooks/useFrameCapture.js
import { useState, useEffect, useRef, useCallback } from "react";
import { cameraErrorMessage } from "@/lib/camera-errors";

/**
 * Lightweight webcam frame-burst capture for server-side liveness enrollment
 * and check-in.
 *
 * This does NO client-side face detection - it just streams the camera and
 * grabs a burst of JPEG blobs. The server verifies liveness/identity across the
 * whole burst and derives the face template from it.
 *
 * A burst that loses the foreground is abandoned (see `captureError`) rather
 * than uploaded, and the camera is released as soon as a burst completes.
 *
 * @param {object} opts
 * @param {number} [opts.frameCount=11]  number of frames to capture in the burst
 * @param {number} [opts.intervalMs=450] delay between frames (~5s total for 11)
 * @param {boolean} [opts.persistCamera=false] keep the camera LIVE after a burst
 *   instead of releasing it. The step-by-step flow captures one action per burst
 *   and must not flicker the camera (or re-prompt permission) between steps, so
 *   it keeps the stream and simply calls startCapture again for the next action.
 * @param {(blobs: Blob[]) => void} [opts.onComplete] called with captured blobs
 */
const INTERRUPTED_MESSAGE =
  "Capture was interrupted. Keep this screen open and try again.";

export const useFrameCapture = ({
  frameCount = 11,
  intervalMs = 450,
  persistCamera = false,
  // When set, frames are downscaled so their width <= maxWidth before encoding.
  // Smaller frames encode far faster, which lets the burst SAMPLE faster - the
  // difference between catching a ~100ms blink and missing it between frames -
  // and keeps the face large enough for landmarks/identity.
  maxWidth = null,
  onComplete,
} = {}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captureError, setCaptureError] = useState("");
  // The camera is released as soon as a burst finishes, so consumers can tell
  // "still warming up" apart from "we let it go, tap to bring it back".
  const [cameraReleased, setCameraReleased] = useState(false);
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
  // Playback position of the previous frame, used to spot a frozen <video>.
  const lastFrameTimeRef = useRef(-1);

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
    setCameraReleased(true);
    setIsCapturing(false);
  }, []);

  // Drop a burst on the floor without touching the camera, so the user can
  // simply tap start again once they are back on this screen.
  const abortCapture = useCallback(() => {
    captureSessionRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    blobsRef.current = [];
    setCapturedCount(0);
    setIsCapturing(false);
    setCaptureError(INTERRUPTED_MESSAGE);
  }, []);

  // Backgrounding the phone (or locking the screen) freezes the <video> while
  // videoWidth stays non-zero, so the burst would quietly become the same
  // frozen frame N times over - the server rejects that as duplicate frames
  // AFTER the user has burned a single-use challenge and a rotating venue
  // code. Bail out the moment we lose the foreground instead.
  useEffect(() => {
    if (!isCapturing) return;

    const handleHidden = () => {
      if (document.visibilityState === "hidden") abortCapture();
    };

    document.addEventListener("visibilitychange", handleHidden);
    return () => {
      document.removeEventListener("visibilitychange", handleHidden);
    };
  }, [isCapturing, abortCapture]);

  const startCamera = useCallback(async () => {
    const session = ++cameraSessionRef.current;
    setCameraError("");
    setCameraReleased(false);
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
      if (session !== cameraSessionRef.current) return;
      setCameraError(cameraErrorMessage(err));
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

    const scale =
      maxWidth && video.videoWidth > maxWidth
        ? maxWidth / video.videoWidth
        : 1;
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
    });
  }, [maxWidth]);

  const startCapture = useCallback(() => {
    if (!cameraReady || isCapturing) return;

    const session = ++captureSessionRef.current;

    blobsRef.current = [];
    lastFrameTimeRef.current = -1;
    setCapturedCount(0);
    setCaptureError("");
    setIsCapturing(true);

    const grabNext = async (index) => {
      if (session !== captureSessionRef.current) return;

      const video = videoRef.current;
      // Second line of defence behind the visibilitychange listener: a frozen
      // <video> stops advancing currentTime, and every further frame would be
      // a byte-for-byte copy of the last live one.
      const frozen =
        index > 0 && video?.currentTime === lastFrameTimeRef.current;
      if (!video || frozen) {
        abortCapture();
        return;
      }
      lastFrameTimeRef.current = video.currentTime;

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
        if (persistCamera) {
          // Step-by-step: the next action reuses the same live camera, so end
          // the burst but keep the stream. startCapture() runs again for it.
          setIsCapturing(false);
        } else {
          // The frames are already in hand and the upload plus the server-side
          // face match can run for minutes, so release the camera now rather
          // than leaving the indicator lit through all of it. startCamera()
          // (via retryCamera or a remount) brings it straight back.
          stopCamera();
        }
        onCompleteRef.current?.(blobsRef.current);
      }
    };

    grabNext(0);
  }, [
    cameraReady,
    isCapturing,
    captureFrame,
    frameCount,
    intervalMs,
    persistCamera,
    abortCapture,
    stopCamera,
  ]);

  const retryCamera = useCallback(() => {
    setCaptureError("");
    stopCamera();
    startCamera();
  }, [stopCamera, startCamera]);

  const progress = frameCount > 0 ? capturedCount / frameCount : 0;

  return {
    videoRef,
    cameraReady,
    cameraError,
    captureError,
    cameraReleased,
    isCapturing,
    capturedCount,
    frameCount,
    progress,
    startCapture,
    retryCamera,
    stopCamera,
  };
};
