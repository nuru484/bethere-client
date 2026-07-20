// src/components/attendance/QrScanner.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, TriangleAlert } from "lucide-react";
import { parseVenuePayload } from "./venue-payload";
import { cameraErrorMessage } from "@/lib/camera-errors";

/**
 * Continuously scans the rear camera for the venue's rotating QR code. On a
 * valid BETHERE1 payload for `eventId` it calls onScan with the extracted code.
 * Wrong-event or malformed codes surface a friendly, non-fatal message and
 * scanning keeps going. The camera stream is released on unmount.
 */
export default function QrScanner({ eventId, onScan, disabled = false }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);

  const [cameraError, setCameraError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (disabled) return undefined;

    handledRef.current = false;
    let cancelled = false;
    const reader = new BrowserQRCodeReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result) => {
          if (!result || handledRef.current) return;

          const { code, error } = parseVenuePayload(
            result.getText(),
            eventId
          );

          if (error) {
            setScanMessage(error);
            return;
          }

          // Single-shot: stop scanning and hand the code up.
          handledRef.current = true;
          setScanMessage("");
          stopScanner();
          onScanRef.current?.(code);
        }
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch((err) => {
        setCameraError(cameraErrorMessage(err));
      });

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [eventId, disabled, attempt, stopScanner]);

  const retryCamera = useCallback(() => {
    setCameraError("");
    setScanMessage("");
    setAttempt((n) => n + 1);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <div
        className="rounded-2xl bg-[#2b2b2b] p-4 sm:p-6"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(250,250,250,0.10) 1px, transparent 1px)",
          backgroundSize: "7px 7px",
        }}
      >
        <div className="relative mb-4 overflow-hidden rounded-xl bg-black sm:mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-72 w-full object-cover sm:h-80"
          />

          {/* Framing corners */}
          <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-[#fafafa]/30"></div>
          <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#fafafa]/30"></div>

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <TriangleAlert
                  className="mx-auto mb-3 h-8 w-8 text-amber-400"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-white/90">{cameraError}</p>
              </div>
            </div>
          )}

          {!cameraError && (
            <div className="absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="rounded-full bg-black/70 px-4 py-2 text-center">
                <p className="text-sm font-semibold text-white">
                  Point at the venue code
                </p>
              </div>
            </div>
          )}
        </div>

        {cameraError ? (
          <Button
            type="button"
            onClick={retryCamera}
            className="w-full rounded-full py-6 font-mono text-sm font-bold uppercase tracking-tight"
          >
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2} />
            Retry Camera
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-white/70">
            <QrCode className="h-4 w-4" strokeWidth={2} />
            <span className="font-mono text-xs font-bold uppercase tracking-tight">
              Scanning...
            </span>
          </div>
        )}
      </div>

      {/* Non-fatal parse feedback (wrong event / not a BeThere code) */}
      {!cameraError && scanMessage && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive">
          {scanMessage}
        </div>
      )}
    </div>
  );
}

QrScanner.propTypes = {
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onScan: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
