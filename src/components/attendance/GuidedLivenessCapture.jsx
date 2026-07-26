// src/components/attendance/GuidedLivenessCapture.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Camera,
  Check,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuidedLivenessCapture } from "@/hooks/useGuidedLivenessCapture";
import { HINT, PHASE } from "@/lib/liveness-gestures";

const ACTION_LABELS = {
  TURN_LEFT: "Turn your head left",
  TURN_RIGHT: "Turn your head right",
  BLINK: "Blink",
  SMILE: "Smile",
};
const ACTION_CHIPS = {
  TURN_LEFT: "Turn left",
  TURN_RIGHT: "Turn right",
  BLINK: "Blink",
  SMILE: "Smile",
};

// Hint codes from the gesture engine -> what the user should hear.
const HINT_COPY = {
  [HINT.NO_FACE]: "Position your face in the frame",
  [HINT.MANY_FACES]: "Make sure only you are in the frame",
  [HINT.TOO_SMALL]: "Move a little closer to the camera",
  [HINT.HOLD_NEUTRAL]: "Look straight at the camera",
  [HINT.RETURN_CENTER]: "Now look back at the camera",
  [HINT.TURN_MORE]: "Turn a little more",
  [HINT.TURN_LESS]: "Come back a little - that's too far",
  [HINT.TURN_OTHER_WAY]: "Turn the other way",
  [HINT.OPEN_EYES]: "Now open your eyes",
};

const ABORT_COPY = {
  timeout:
    "We couldn't detect that action in time. Find even lighting, keep your face in the frame, and try again.",
  interrupted: "Capture was interrupted. Keep this screen open and try again.",
};

/**
 * Guided one-take capture surface. The user starts once, the on-device guide
 * walks them through every challenged action in order (with live coaching),
 * and the full ordered burst is handed up via onComplete for a SINGLE server
 * verification - no per-action round-trips.
 *
 * The parent owns the challenge: it passes the ordered actions and the
 * challenge deadline, uploads the burst, and calls out failures through
 * `errorMessage` + `onRetry` (fresh challenge) since batch challenges are
 * single-use.
 */
export default function GuidedLivenessCapture({
  actions,
  isSubmitting = false,
  errorMessage = "",
  expiresAt = null,
  onComplete,
  onExpired,
  onRetry,
  startLabel = "Start scan",
}) {
  const [abortReason, setAbortReason] = useState("");
  const {
    videoRef,
    cameraReady,
    cameraError,
    modelStatus,
    running,
    progress,
    start,
    cancel,
    retryCamera,
    retryModel,
  } = useGuidedLivenessCapture({
    actions,
    onComplete,
    onAbort: (reason) => setAbortReason(reason),
  });

  // Challenge countdown: batch challenges are short-lived by design (the TTL
  // bounds the venue-code relay window server-side), so surface the clock
  // and hand control back to the parent when it runs out mid-capture.
  const [secondsLeft, setSecondsLeft] = useState(null);
  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null);
      return undefined;
    }
    const deadline = new Date(expiresAt).getTime();
    if (Number.isNaN(deadline)) {
      setSecondsLeft(null);
      return undefined;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        cancel();
        onExpired?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // cancel/onExpired are stable enough per challenge; keyed on the deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const currentActionCode =
    progress.phase === PHASE.ACTION ? actions[progress.actionIndex] : null;

  const instruction = useMemo(() => {
    if (!running) return null;
    // Framing problems and action coaching take priority over the base label.
    if (progress.hint && progress.hint !== HINT.DO_ACTION) {
      return HINT_COPY[progress.hint] ?? null;
    }
    if (currentActionCode)
      return ACTION_LABELS[currentActionCode] ?? currentActionCode;
    return HINT_COPY[HINT.HOLD_NEUTRAL];
  }, [running, progress.hint, currentActionCode]);

  const abortMessage = abortReason ? ABORT_COPY[abortReason] : "";
  const showStart = !running && !isSubmitting;

  const handleStart = () => {
    setAbortReason("");
    start();
  };

  const startButtonLabel = isSubmitting
    ? "Verifying..."
    : modelStatus === "loading"
      ? "Preparing face guide..."
      : !cameraReady
        ? "Starting camera..."
        : errorMessage || abortMessage
          ? "Try again"
          : startLabel;

  const startDisabled =
    isSubmitting || running || !cameraReady || modelStatus !== "ready";

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
        {/* Action progress chips: every challenged action, ticked as the
            on-device guide confirms it. */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
          {actions.map((action, index) => {
            const isDone = progress.completedActions[index];
            const isCurrent = running && progress.actionIndex === index;
            return (
              <span
                key={`${action}-${index}`}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight transition-colors ${
                  isDone
                    ? "bg-[#3ecf8e]/20 text-[#3ecf8e]"
                    : isCurrent
                      ? "bg-[#fafafa] text-[#2b2b2b]"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                {ACTION_CHIPS[action] ?? action}
              </span>
            );
          })}
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

          {!cameraError && modelStatus === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <div className="text-center">
                <TriangleAlert
                  className="mx-auto mb-3 h-8 w-8 text-amber-400"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-white/90">
                  The face guide could not load. Check your connection and try
                  again.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3 rounded-full font-mono text-xs font-bold uppercase tracking-tight"
                  onClick={retryModel}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Live instruction pill */}
          {!cameraError && running && instruction && (
            <div className="absolute inset-x-0 top-4 flex justify-center px-4">
              <div className="max-w-full rounded-full bg-black/70 px-4 py-2 text-center">
                {currentActionCode && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-tight text-white/60">
                    Action {progress.actionIndex + 1} of {actions.length}
                  </span>
                )}
                <p className="mt-0.5 text-base font-semibold text-white">
                  {instruction}
                </p>
              </div>
            </div>
          )}

          {/* Challenge countdown, only while it matters */}
          {running && secondsLeft !== null && secondsLeft <= 30 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1">
              <span className="font-mono text-xs font-bold text-white/80">
                {secondsLeft}s left
              </span>
            </div>
          )}

          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Verifying...</span>
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
        ) : showStart ? (
          <Button
            type="button"
            onClick={errorMessage && onRetry ? onRetry : handleStart}
            disabled={startDisabled}
            className="w-full rounded-full bg-[#fafafa] py-6 font-mono text-sm font-bold uppercase tracking-tight text-[#2b2b2b] hover:bg-white"
          >
            {modelStatus === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Camera className="mr-2 h-4 w-4" strokeWidth={2} />
            )}
            {startButtonLabel}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-white/80">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your scan...
              </>
            ) : (
              <>Follow the prompts above - it only takes a few seconds.</>
            )}
          </div>
        )}
      </div>

      {/* Feedback below the surface: server rejection, local abort, or the
          standing how-to. */}
      {errorMessage || abortMessage ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <TriangleAlert
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={1.75}
          />
          <span>{errorMessage || abortMessage}</span>
        </div>
      ) : (
        !cameraError && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-[#3ecf8e]" strokeWidth={2.5} />
              <span>
                Tap start, then follow each prompt - it checks everything in
                one go. Keep your face in the frame with good lighting.
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

GuidedLivenessCapture.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string).isRequired,
  isSubmitting: PropTypes.bool,
  errorMessage: PropTypes.string,
  expiresAt: PropTypes.string,
  onComplete: PropTypes.func.isRequired,
  onExpired: PropTypes.func,
  onRetry: PropTypes.func,
  startLabel: PropTypes.string,
};
