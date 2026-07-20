// src/components/attendance/LivenessCapture.jsx
import PropTypes from "prop-types";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, TriangleAlert } from "lucide-react";

// Server-issued action codes -> human-readable prompts.
const ACTION_LABELS = {
  TURN_LEFT: "Turn your head left",
  TURN_RIGHT: "Turn your head right",
  BLINK: "Blink your eyes",
  SMILE: "Smile",
};

const labelFor = (action) => ACTION_LABELS[action] || action;

/**
 * Check-in capture surface: streams the webcam and, on Start, captures a burst
 * of JPEG frames while cycling the challenge prompts so the user performs each
 * action during the ~5s window. Hands the raw Blobs back via onCapture.
 *
 * Frames are handed over IN CAPTURE ORDER and the prompts are cycled in the
 * challenge's order, which the server relies on: it proves each action strictly
 * after the previous one, so performing them out of sequence fails. Do not
 * reorder or de-duplicate the burst before uploading it.
 */
export default function LivenessCapture({
  actions = [],
  onCapture,
  isSubmitting = false,
  startLabel = "Start Check-In Scan",
}) {
  const {
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
  } = useFrameCapture({ onComplete: onCapture });

  // Which prompt to highlight during capture: split the burst evenly across
  // the actions so each gets roughly the same slice of the capture window.
  const activeActionIndex =
    actions.length > 0
      ? Math.min(
          Math.floor(progress * actions.length),
          actions.length - 1
        )
      : 0;

  const busy = isCapturing || isSubmitting;
  // The camera is released on purpose once a burst is captured, so the primary
  // action then becomes bringing it back rather than an unreachable "start".
  const needsCameraRestart = cameraReleased && !cameraReady;

  const buttonLabel = isSubmitting
    ? "Verifying..."
    : isCapturing
    ? `Capturing ${capturedCount}/${frameCount}...`
    : needsCameraRestart
    ? "Restart Camera"
    : !cameraReady
    ? "Starting camera..."
    : captureError
    ? "Try Again"
    : startLabel;

  return (
    <div className="w-full max-w-2xl">
      <div
        className="bg-[#2b2b2b] p-4 sm:p-6 rounded-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(250,250,250,0.10) 1px, transparent 1px)",
          backgroundSize: "7px 7px",
        }}
      >
        <div className="relative bg-black rounded-xl overflow-hidden mb-4 sm:mb-6">
          {/* Mirror the preview for a natural selfie feel. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-72 sm:h-80 object-cover -scale-x-100"
          />

          {/* Framing corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#fafafa]/30"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#fafafa]/30"></div>

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

          {/* Burst abandoned because the screen was backgrounded/locked */}
          {!cameraError && captureError && !isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <TriangleAlert
                  className="mx-auto mb-3 h-8 w-8 text-amber-400"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-white/90">{captureError}</p>
              </div>
            </div>
          )}

          {/* Live action prompt during capture */}
          {isCapturing && actions.length > 0 && (
            <div className="absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="rounded-full bg-black/70 px-4 py-2 text-center">
                <span className="font-mono text-[10px] font-bold uppercase tracking-tight text-white/60">
                  Step {activeActionIndex + 1} of {actions.length}
                </span>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {labelFor(actions[activeActionIndex])}
                </p>
              </div>
            </div>
          )}

          {/* Capture progress bar */}
          {isCapturing && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
              <div
                className="h-full bg-[#3ecf8e] transition-all duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              ></div>
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
          <Button
            type="button"
            onClick={needsCameraRestart ? retryCamera : startCapture}
            disabled={busy || (!cameraReady && !needsCameraRestart)}
            className="w-full rounded-full bg-[#fafafa] py-6 font-mono text-sm font-bold uppercase tracking-tight text-[#2b2b2b] hover:bg-white"
          >
            <Camera className="mr-2 h-4 w-4" strokeWidth={2} />
            {buttonLabel}
          </Button>
        )}
      </div>

      {/* Instructions: the actions the user will be asked to perform */}
      {!cameraError && actions.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            When you tap start, you will be asked to
          </h3>
          <ol className="space-y-1 text-sm text-foreground">
            {actions.map((action, index) => (
              <li key={`${action}-${index}`} className="flex items-center gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-foreground">
                  {index + 1}
                </span>
                {labelFor(action)}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Keep your face in the frame and follow the prompts. Ensure good
            lighting.
          </p>
        </div>
      )}
    </div>
  );
}

LivenessCapture.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  onCapture: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  startLabel: PropTypes.string,
};
