// src/hooks/useFaceScanner.js
import { useState, useEffect, useRef, useCallback } from "react";
import { FaceAuthSystem } from "@/lib/FaceAuthSystem";

export const useFaceScanner = () => {
  const [authSystem, setAuthSystem] = useState(null);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [scanStep, setScanStep] = useState("idle");
  const [isInitializing, setIsInitializing] = useState(true);
  const [webcamActive, setWebcamActive] = useState(false);

  const videoRef = useRef(null);
  const scanSamples = useRef([]);
  const streamRef = useRef(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  }, []);

  const startWebcam = useCallback(async (isCancelled) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Unmounted (or StrictMode-remounted) while the permission prompt was up:
      // nobody would ever stop this stream, so release it here.
      if (isCancelled()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setWebcamActive(true);
          setStatus("Ready to scan face.");
        };
      }
    } catch (err) {
      if (isCancelled()) return;
      setError(err.message || "Failed to access webcam.");
      setStatus("Camera error.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    const init = async () => {
      setIsInitializing(true);
      setStatus("Loading face detection models...");
      try {
        const system = new FaceAuthSystem();
        const initialized = await system.initialize();
        if (cancelled) return;
        if (initialized) {
          setAuthSystem(system);
          setStatus("System initialized. Starting webcam...");
          await startWebcam(isCancelled);
        } else {
          throw new Error("Failed to initialize face detection models.");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setStatus("Initialization failed.");
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !webcamActive) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return canvas;
  };

  const startScan = async () => {
    if (!authSystem || !webcamActive) {
      setError("Webcam not active or system not initialized.");
      return;
    }

    setScanStep("started");
    setStatus("Capturing face samples...");
    setError(null);
    setResult(null);
    scanSamples.current = [];

    try {
      for (let i = 0; i < 3; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, 1000));
        const img = captureImage();
        if (img) scanSamples.current.push(img);
      }

      setStatus("Processing face scan...");
      const response = await authSystem.scanFace(scanSamples.current);

      if (!response.success) throw new Error(response.message);
      setResult(response);
      setScanStep("complete");
      setStatus("Face scan completed successfully.");
    } catch (err) {
      setError(err.message || "Scan failed.");
      setStatus("Scan failed.");
      setScanStep("failed");
    }
  };

  const reset = useCallback(() => {
    setResult(null);
    setScanStep("idle");
    setError(null);
    setStatus("Ready to scan face.");
    scanSamples.current = [];
  }, []);

  return {
    videoRef,
    status,
    error,
    result,
    scanStep,
    isInitializing,
    webcamActive,
    startScan,
    reset, 
  };
};