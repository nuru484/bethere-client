// src/components/attendance/StepLivenessCapture.jsx
import PropTypes from "prop-types";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, TriangleAlert, Check, Loader2 } from "lucide-react";

// Server action codes -> the instruction shown before capture and the short cue
// shown DURING capture ("do it now").
const ACTION_LABELS = {
  TURN_LEFT: "Turn your head left",
  TURN_RIGHT: "Turn your head right",
  BLINK: "Blink a few times",
  SMILE: "Smile",
};
const ACTION_CUES = {
  TURN_LEFT: "Turn left now",
  TURN_RIGHT: "Turn right now",
  BLINK: "Keep blinking",
  SMILE: "Smile now",
};
const labelFor = (action) => ACTION_LABELS[action] || action;
const cueFor = (action) => ACTION_CUES[action] || "Hold still";

/**
 * Step-by-step capture surface. Stays mounted for the WHOLE flow so the camera
 * never flickers between actions: the parent updates `action`/`stepNumber` as
 * each step is verified, and this component captures one dense single-action
 * burst per step and hands the raw Blobs back via onFrames.
 *
 * A blink is a ~200ms transition, so blink steps capture more frames, faster,
 * to make sure the closed-eye frame lands in the burst.
 *
 * The parent owns verification: while it uploads it sets `isValidating`, and a
 * server rejection comes back as `errorMessage` so the SAME action is re-tried
 * (the step never advances until the server confirms it).
 */
export default function StepLivenessCapture({
  action,
  stepNumber = 1,
  totalSteps = 1,
  isValidating = false,
  errorMessage = "",
  onFrames,
  startLabel = "Start scan",
}) {
  const isBlink = action === "BLINK";
  const {
    videoRef,
    cameraReady,
    cameraError,
    captureError,
    isCapturing,
    capturedCount,
    frameCount,
    progress,
    startCapture,
    retryCamera,
  } = useFrameCapture({
    persistCamera: true,
    // A blink is a ~100ms transient, so it needs MANY frames sampled FAST (and
    // the user is prompted to blink repeatedly) to land a closed frame in the
    // burst; holdable actions need only a steady window. Downscaling makes each
    // grab quick enough that the effective sampling actually catches the blink.
    frameCount: isBlink ? 16 : 9,
    intervalMs: isBlink ? 80 : 170,
    maxWidth: 560,
    onComplete: onFrames,
  });

  const busy = isCapturing || isValidating;
  const hasStartedOnce = stepNumber > 1 || Boolean(errorMessage);

  const buttonLabel = isValidating
    ? "Checking..."
    : isCapturing
      ? `Capturing ${capturedCount}/${frameCount}...`
      : !cameraReady
        ? "Starting camera..."
        : errorMessage
          ? "Try this step again"
          : hasStartedOnce
            ? "I'm ready - capture"
            : startLabel;

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
        {/* Step progress dots */}
        <div className="mb-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < stepNumber - 1
                  ? "w-6 bg-[#3ecf8e]"
                  : i === stepNumber - 1
                    ? "w-6 bg-[#fafafa]"
                    : "w-3 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="relative mb-4 overflow-hidden rounded-xl bg-black sm:mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-72 w-full -scale-x-100 object-cover sm:h-80"
          />

          <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-[#fafafa]/30" />
          <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-[#fafafa]/30" />
          <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-[#fafafa]/30" />
          <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#fafafa]/30" />

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

          {!cameraError && captureError && !isCapturing && !isValidating && (
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

          {/* Current-action prompt. Big cue while capturing; the instruction
              and step count otherwise. */}
          {!cameraError && action && (
            <div className="absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="rounded-full bg-black/70 px-4 py-2 text-center">
                <span className="font-mono text-[10px] font-bold uppercase tracking-tight text-white/60">
                  Step {stepNumber} of {totalSteps}
                </span>
                <p className="mt-0.5 text-base font-semibold text-white">
                  {isCapturing ? cueFor(action) : labelFor(action)}
                </p>
              </div>
            </div>
          )}

          {/* Verifying overlay while the parent uploads this step. */}
          {isValidating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Verifying...</span>
              </div>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
              <div
                className="h-full bg-[#3ecf8e] transition-all duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
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
            onClick={startCapture}
            disabled={busy || !cameraReady}
            className="w-full rounded-full bg-[#fafafa] py-6 font-mono text-sm font-bold uppercase tracking-tight text-[#2b2b2b] hover:bg-white"
          >
            {isValidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Camera className="mr-2 h-4 w-4" strokeWidth={2} />
            )}
            {buttonLabel}
          </Button>
        )}
      </div>

      {/* Per-step feedback: a retry prompt on failure, else what to do next. */}
      {errorMessage ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      ) : (
        !cameraError &&
        action && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-[#3ecf8e]" strokeWidth={2.5} />
              <span>
                Tap capture, then <strong>{labelFor(action).toLowerCase()}</strong>.
                Keep your face in the frame with good lighting.
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

StepLivenessCapture.propTypes = {
  action: PropTypes.string,
  stepNumber: PropTypes.number,
  totalSteps: PropTypes.number,
  isValidating: PropTypes.bool,
  errorMessage: PropTypes.string,
  onFrames: PropTypes.func.isRequired,
  startLabel: PropTypes.string,
};
