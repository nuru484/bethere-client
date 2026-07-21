// src/components/attendance/MarkAttendance.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  useRequestAttendanceStepChallenge,
  useSubmitAttendanceStep,
} from "@/hooks/useAttendance";
import StepLivenessCapture from "@/components/attendance/StepLivenessCapture";
import QrScanner from "@/components/attendance/QrScanner";
import { useAuth } from "@/hooks/useAuth";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { Button } from "@/components/ui/button";

// Step-by-step flow for BOTH directions:
//  scan      -> scan the venue's rotating QR to prove presence
//  requesting-> exchange the venue code for a step-by-step liveness challenge
//  capture   -> perform ONE prompted action at a time; each is verified by the
//               server before the next is shown, and the last commits attendance
const STAGE = {
  SCAN: "scan",
  REQUESTING: "requesting",
  CAPTURE: "capture",
};

export default function MarkAttendance({ type = "in" }) {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGE.SCAN);
  const [challengeToken, setChallengeToken] = useState(null);
  // The server re-validates the rotating venue code at the final step, so the
  // scanned code has to survive the challenge stage and ride along on every
  // per-action upload.
  const [venueCode, setVenueCode] = useState(null);
  // Step-by-step progress: the action to perform now, its 1-based number, the
  // total, and the last server rejection (shown so the SAME step is re-tried).
  const [currentAction, setCurrentAction] = useState(null);
  const [stepNumber, setStepNumber] = useState(1);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepError, setStepError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  // Bumped to force-remount the scanner (which stops itself after a scan) when
  // we drop back to the scan stage.
  const [scanKey, setScanKey] = useState(0);
  // Success redirect is delayed so the confirmation is readable; drop it if the
  // user navigates away first, otherwise they get yanked back.
  const redirectTimerRef = useRef(null);
  useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    },
    []
  );

  const { mutate: requestChallenge, isPending: isRequestingChallenge } =
    useRequestAttendanceStepChallenge();
  const { mutate: submitStep, isPending: isSubmitting } =
    useSubmitAttendanceStep();

  const isCheckIn = type === "in";
  const mode = isCheckIn ? "in" : "out";

  // Only USER-role principals are attendants. Admins have no attendance and
  // the backend rejects these endpoints for them, so send them back.
  const isAdmin = user?.role === "ADMIN";

  // The route param is a string and can be anything the user typed. Strict
  // digits-only: parseInt would accept "12abc" as 12 and quietly mark
  // attendance against event 12.
  const hasValidEventId = /^\d+$/.test(eventId ?? "");
  const numericEventId = hasValidEventId ? Number.parseInt(eventId, 10) : NaN;

  // Codes rotate and challenges are single-use, so always restart clean.
  const resetToScan = useCallback(() => {
    setStage(STAGE.SCAN);
    setChallengeToken(null);
    setVenueCode(null);
    setCurrentAction(null);
    setStepNumber(1);
    setTotalSteps(0);
    setStepError("");
    setScanKey((k) => k + 1);
  }, []);

  // Stage 2: exchange the scanned venue code for a step-by-step challenge and
  // drop into the capture flow at its first action.
  const handleScan = useCallback(
    (scannedCode) => {
      setStage(STAGE.REQUESTING);
      setStatusMessage({ message: "Verifying venue code...", type: "loading" });

      requestChallenge(
        { eventId: numericEventId, venueCode: scannedCode, mode },
        {
          onSuccess: (response) => {
            const data = response?.data || {};
            setChallengeToken(data.challengeToken ?? null);
            setVenueCode(scannedCode);
            setCurrentAction(data.nextAction ?? null);
            setStepNumber((data.currentStep ?? 0) + 1);
            setTotalSteps(data.totalSteps ?? 0);
            setStepError("");
            setStatusMessage(null);
            setStage(STAGE.CAPTURE);
          },
          onError: (error) => {
            const { message } = extractApiErrorMessage(error);
            const errMsg =
              message || "That venue code did not work. Please scan again.";
            toast.error(errMsg);
            setStatusMessage({ message: errMsg, type: "error" });
            resetToScan();
          },
        }
      );
    },
    [requestChallenge, numericEventId, mode, resetToScan]
  );

  // Stage 3: one action at a time. Upload this action's burst; the server either
  // advances us to the next action, commits attendance on the last step, or
  // rejects this action (shown inline so the SAME step is re-tried).
  const handleFrames = useCallback(
    (blobs) => {
      if (!challengeToken || !venueCode) {
        toast.error("Your session expired. Please scan the venue code again.");
        resetToScan();
        return;
      }
      if (!blobs || blobs.length < 4) {
        setStepError("We couldn't capture that. Hold still and try this step again.");
        return;
      }

      const formData = new FormData();
      formData.append("challengeToken", challengeToken);
      formData.append("venueCode", venueCode);
      blobs.forEach((blob, index) => {
        formData.append("frames", blob, `frame-${index}.jpg`);
      });

      setStepError("");

      submitStep(
        { eventId: numericEventId, formData, mode },
        {
          onSuccess: (response) => {
            const data = response?.data || {};
            if (data.done) {
              const msg =
                response?.message ||
                (isCheckIn ? "Checked in successfully!" : "Checked out successfully!");
              toast.success(msg);
              setStatusMessage({ message: msg, type: "success" });
              setStage(STAGE.REQUESTING); // brief confirmation, no capture surface
              redirectTimerRef.current = setTimeout(
                () => navigate(`/dashboard/events/${eventId}`),
                1500
              );
              return;
            }
            // Verified: advance to the next prompted action.
            setCurrentAction(data.nextAction ?? null);
            setStepNumber((data.currentStep ?? 0) + 1);
            if (data.totalSteps) setTotalSteps(data.totalSteps);
          },
          onError: (error) => {
            const { message, code } = extractApiErrorMessage(error);
            // A missed action: keep the user on THIS step and let them retry.
            if (code === "STEP_FAILED") {
              setStepError(
                message || "We couldn't verify that action. Try this step again."
              );
              return;
            }
            // Expired/spent challenge, stale venue code, or a conflict: the whole
            // scan has to start over.
            const errMsg = message || "Your scan could not be completed.";
            toast.error(errMsg);
            setStatusMessage({
              message: `${errMsg} Please scan the venue code again.`,
              type: "error",
            });
            resetToScan();
          },
        }
      );
    },
    [
      challengeToken,
      venueCode,
      isCheckIn,
      mode,
      submitStep,
      numericEventId,
      eventId,
      navigate,
      resetToScan,
    ]
  );

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Malformed URL (e.g. /dashboard/events/abc/attendance-in): nothing here
  // can work without a real event id, so bail to the events list.
  if (!hasValidEventId) {
    return <Navigate to="/dashboard/events" replace />;
  }

  const statusClasses = {
    loading: "bg-card border-border text-muted-foreground",
    info: "bg-card border-border text-muted-foreground",
    success:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    error: "bg-destructive/10 border-destructive/20 text-destructive",
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Attendance
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Mark Attendance {isCheckIn ? "In" : "Out"}
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              {isCheckIn
                ? "Scan the venue code, then verify your face to check in"
                : "Scan the venue code, then verify your face to check out"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
          >
            Back
          </Button>
        </div>

        {/* Status message: narrated for screen-reader users - this is the
            flow where a blind user most needs the state changes read out. */}
        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border p-4 text-center font-medium ${
              statusClasses[statusMessage.type] || statusClasses.info
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        {stage === STAGE.CAPTURE ? (
          <div className="flex justify-center">
            <StepLivenessCapture
              action={currentAction}
              stepNumber={stepNumber}
              totalSteps={totalSteps}
              isValidating={isSubmitting}
              errorMessage={stepError}
              onFrames={handleFrames}
              startLabel={isCheckIn ? "Start check-in scan" : "Start check-out scan"}
            />
          </div>
        ) : stage === STAGE.REQUESTING ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-16">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
              role="status"
              aria-label="Verifying venue code"
            />
            <p className="text-sm text-muted-foreground">
              Verifying venue code...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
                Before You Scan
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Ensure you have a registered face scan</li>
                <li>• Allow camera permission when prompted</li>
                <li>• Point your camera at the venue code on screen</li>
                <li>• Ensure good lighting for accurate verification</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <QrScanner
                key={scanKey}
                eventId={numericEventId}
                onScan={handleScan}
                disabled={!user?.id || isRequestingChallenge}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MarkAttendance.propTypes = {
  type: PropTypes.oneOf(["in", "out"]),
};
