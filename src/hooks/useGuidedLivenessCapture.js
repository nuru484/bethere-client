// src/hooks/useGuidedLivenessCapture.js
import { useCallback, useEffect, useRef, useState } from "react";
import { cameraErrorMessage } from "@/lib/camera-errors";
import { loadFaceLandmarker } from "@/lib/face-landmarker";
import {
  createGuidedSession,
  extractSignals,
  PHASE,
} from "@/lib/liveness-gestures";

/**
 * Guided liveness capture: streams the camera, runs on-device face-landmark
 * detection, walks the user through the server-challenged actions in order
 * (via the pure session machine in lib/liveness-gestures), captures the
 * proving JPEG frames as each gesture happens, and hands the FULL ordered
 * burst to `onComplete` in one go for a single server round-trip.
 *
 * The detector only GATES capture - the server re-verifies everything from
 * the raw frames. No landmark data ever leaves the device.
 *
 * Hardening carried over from the old burst hook (useFrameCapture):
 *  - session counters kill in-flight work from torn-down camera/runs;
 *  - backgrounding the tab aborts the run (a frozen <video> would otherwise
 *    feed the same frame forever);
 *  - per-action timeout so a gesture the detector never sees fails loudly
 *    instead of hanging the challenge until its TTL dies silently.
 *
 * @param {object} opts
 * @param {string[]} opts.actions ordered server challenge actions
 * @param {(blobs: Blob[]) => void} opts.onComplete full ordered burst
 * @param {(reason: "timeout"|"interrupted") => void} [opts.onAbort]
 * @param {number} [opts.actionTimeoutMs=15000] max time per action once running
 * @param {number} [opts.maxWidth=560] capture downscale bound
 */
const DETECT_INTERVAL_MS = 66; // ~15 samples/s: enough for a blink, kind to batteries

export const useGuidedLivenessCapture = ({
  actions,
  onComplete,
  onAbort,
  actionTimeoutMs = 15000,
  maxWidth = 560,
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [modelStatus, setModelStatus] = useState("loading"); // loading|ready|error
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({
    phase: null,
    actionIndex: -1,
    hint: null,
    completedActions: [],
    capturedTotal: 0,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const sessionRef = useRef(null);
  const blobPromisesRef = useRef([]);
  const rafRef = useRef(null);
  const lastDetectAtRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const phaseStartedAtRef = useRef(0);
  const phaseKeyRef = useRef("");
  const onCompleteRef = useRef(onComplete);
  const onAbortRef = useRef(onAbort);
  // Bumped on every teardown so awaited work (getUserMedia, toBlob, model
  // load) can tell it belongs to a dead session and bail out.
  const cameraSessionRef = useRef(0);
  const runSessionRef = useRef(0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onAbortRef.current = onAbort;
  }, [onComplete, onAbort]);

  const stopRun = useCallback(() => {
    runSessionRef.current += 1;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sessionRef.current = null;
    blobPromisesRef.current = [];
    setRunning(false);
  }, []);

  const stopCamera = useCallback(() => {
    cameraSessionRef.current += 1;
    stopRun();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, [stopRun]);

  const startCamera = useCallback(async () => {
    const session = ++cameraSessionRef.current;
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (session !== cameraSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      if (session !== cameraSessionRef.current) return;
      setCameraError(cameraErrorMessage(err));
    }
  }, []);

  // Camera warms up on mount, torn down on unmount.
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Model load is retryable independently of the camera (a failed download
  // must not force a camera flicker to try again).
  const [modelAttempt, setModelAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setModelStatus("loading");
    loadFaceLandmarker()
      .then((landmarker) => {
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setModelStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setModelStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [modelAttempt]);

  const retryModel = useCallback(() => setModelAttempt((a) => a + 1), []);

  const abortRun = useCallback(
    (reason) => {
      stopRun();
      onAbortRef.current?.(reason);
    },
    [stopRun]
  );

  // Backgrounding freezes the <video> while the loop keeps sampling the same
  // pixels; the run cannot be trusted after that, so it aborts.
  useEffect(() => {
    if (!running) return;
    const handleHidden = () => {
      if (document.visibilityState === "hidden") abortRun("interrupted");
    };
    document.addEventListener("visibilitychange", handleHidden);
    return () =>
      document.removeEventListener("visibilitychange", handleHidden);
  }, [running, abortRun]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.resolve(null);
    const scale =
      maxWidth && video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas
      .getContext("2d")
      .drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
    });
  }, [maxWidth]);

  const start = useCallback(() => {
    if (running || !cameraReady || modelStatus !== "ready") return;
    if (!Array.isArray(actions) || actions.length === 0) return;

    const run = ++runSessionRef.current;
    const session = createGuidedSession(actions);
    sessionRef.current = session;
    blobPromisesRef.current = [];
    lastDetectAtRef.current = 0;
    lastVideoTimeRef.current = -1;
    phaseStartedAtRef.current = performance.now();
    phaseKeyRef.current = "";
    setRunning(true);
    setProgress({
      phase: PHASE.PRIME,
      actionIndex: -1,
      hint: null,
      completedActions: actions.map(() => false),
      capturedTotal: 0,
    });

    const finish = async () => {
      const blobs = (await Promise.all(blobPromisesRef.current)).filter(
        Boolean
      );
      if (run !== runSessionRef.current) return;
      stopRun();
      onCompleteRef.current?.(blobs);
    };

    const loop = (nowMs) => {
      if (run !== runSessionRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2 || !video.videoWidth)
        return;
      if (nowMs - lastDetectAtRef.current < DETECT_INTERVAL_MS) return;
      // Same currentTime as the previous sample = the element is frozen
      // (OS camera hand-off, screen lock): nothing new to look at.
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastDetectAtRef.current = nowMs;
      lastVideoTimeRef.current = video.currentTime;

      let result;
      try {
        result = landmarker.detectForVideo(video, nowMs);
      } catch {
        return; // transient detector hiccup: skip this sample
      }
      const outcome = session.step(extractSignals(result), nowMs);

      // Per-action watchdog, keyed on phase+action so any advance resets it.
      const phaseKey = `${outcome.phase}:${outcome.actionIndex}`;
      if (phaseKey !== phaseKeyRef.current) {
        phaseKeyRef.current = phaseKey;
        phaseStartedAtRef.current = nowMs;
      } else if (
        nowMs - phaseStartedAtRef.current > actionTimeoutMs &&
        outcome.phase !== PHASE.DONE
      ) {
        abortRun("timeout");
        return;
      }

      if (outcome.capture) blobPromisesRef.current.push(captureFrame());

      const snap = session.snapshot();
      setProgress({
        phase: outcome.phase,
        actionIndex: outcome.actionIndex,
        hint: outcome.hint,
        completedActions: snap.completedActions,
        capturedTotal: snap.capturedTotal,
      });

      if (outcome.done) {
        // Stop sampling; deliver once every in-flight toBlob settles.
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        finish();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [
    running,
    cameraReady,
    modelStatus,
    actions,
    actionTimeoutMs,
    captureFrame,
    stopRun,
    abortRun,
  ]);

  const retryCamera = useCallback(() => {
    stopCamera();
    startCamera();
  }, [stopCamera, startCamera]);

  return {
    videoRef,
    cameraReady,
    cameraError,
    modelStatus,
    running,
    progress,
    start,
    cancel: stopRun,
    retryCamera,
    retryModel,
    stopCamera,
  };
};
