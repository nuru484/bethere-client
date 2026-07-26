// src/components/attendance/MarkAttendance.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router";
import {
  useRequestAttendanceChallenge,
  useCreateAttendance,
  useUpdateAttendance,
  useInvalidateAfterAttendance,
} from "@/hooks/useAttendance";
import GuidedLivenessCapture from "@/components/attendance/GuidedLivenessCapture";
import PairFromPhone from "@/components/attendance/PairFromPhone";
import QrScanner from "@/components/attendance/QrScanner";
import { useAuth } from "@/hooks/useAuth";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { loadFaceLandmarker, preloadFaceLandmarker } from "@/lib/face-landmarker";
import { Button } from "@/components/ui/button";

// Guided one-take flow for BOTH directions:
//  scan      -> scan the venue's rotating QR to prove presence
//  requesting-> exchange the venue code for a liveness challenge (the ordered
//               actions + a single-use token)
//  capture   -> the on-device guide prompts every action in order, captures
//               the proving frames locally, and ONE upload verifies the whole
//               burst server-side and commits attendance
const STAGE = {
  SCAN: "scan",
  REQUESTING: "requesting",
  CAPTURE: "capture",
};

// The server's minimum usable batch size; fewer means capture went wrong
// locally and the upload would be rejected anyway.
const MIN_BATCH_FRAMES = 6;

export default function MarkAttendance({ type = "in" }) {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGE.SCAN);
  const [challenge, setChallenge] = useState(null); // { token, actions, expiresAt }
  // The server re-validates the rotating venue code at upload, so the scanned
  // code has to survive the challenge stage and ride along with the burst.
  // It also lets a failed verification retry with a FRESH challenge without
  // forcing a re-scan of the QR (codes stay valid across a skew window).
  const [venueCode, setVenueCode] = useState(null);
  const [captureError, setCaptureError] = useState("");
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

  // Warm the on-device face guide while the user is still at the QR step so
  // the short-lived challenge never waits on a model download.
  useEffect(() => {
    preloadFaceLandmarker();
  }, []);

  const { mutate: requestChallenge, isPending: isRequestingChallenge } =
    useRequestAttendanceChallenge();
  const { mutate: checkIn, isPending: isCheckingIn } = useCreateAttendance();
  const { mutate: checkOut, isPending: isCheckingOut } = useUpdateAttendance();
  const invalidateAfterAttendance = useInvalidateAfterAttendance();

  const isCheckIn = type === "in";
  const mode = isCheckIn ? "in" : "out";
  const isSubmitting = isCheckingIn || isCheckingOut;

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
    setChallenge(null);
    setVenueCode(null);
    setCaptureError("");
    setScanKey((k) => k + 1);
  }, []);

  // Exchange a venue code for a fresh challenge and enter (or re-enter) the
  // guided capture. Used by the QR scan AND by post-failure retries, which
  // reuse the stored code instead of demanding another scan.
  const startChallenge = useCallback(
    (code) => {
      setStage(STAGE.REQUESTING);
      setCaptureError("");
      setStatusMessage({ message: "Verifying venue code...", type: "loading" });

      // The model must be in hand BEFORE the challenge clock starts: its TTL
      // is deliberately short and a first-visit model download could eat it.
      loadFaceLandmarker()
        .catch(() => undefined)
        .then(() => {
          requestChallenge(
            { eventId: numericEventId, venueCode: code, mode },
            {
              onSuccess: (response) => {
                const data = response?.data || {};
                if (!data.challengeToken || !Array.isArray(data.actions)) {
                  toast.error("Could not start the scan. Please try again.");
                  resetToScan();
                  return;
                }
                setChallenge({
                  token: data.challengeToken,
                  actions: data.actions,
                  expiresAt: data.expiresAt ?? null,
                });
                setVenueCode(code);
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
        });
    },
    [requestChallenge, numericEventId, mode, resetToScan]
  );

  const handleScan = useCallback(
    (scannedCode) => startChallenge(scannedCode),
    [startChallenge]
  );

  // A consumed/expired challenge needs a new one; the stored venue code is
  // usually still inside the server's acceptance window, so retry without a
  // re-scan and only fall back to scanning when the server refuses it.
  const restartWithFreshChallenge = useCallback(() => {
    if (!venueCode) {
      resetToScan();
      return;
    }
    startChallenge(venueCode);
  }, [venueCode, startChallenge, resetToScan]);

  // The guided capture finished every action: upload the ordered burst. ONE
  // request verifies the whole thing and commits attendance.
  const handleFrames = useCallback(
    (blobs) => {
      if (!challenge?.token || !venueCode) {
        toast.error("Your session expired. Please scan the venue code again.");
        resetToScan();
        return;
      }
      if (!blobs || blobs.length < MIN_BATCH_FRAMES) {
        setCaptureError(
          "We couldn't capture enough of that. Try again in better lighting."
        );
        return;
      }

      const formData = new FormData();
      formData.append("challengeToken", challenge.token);
      formData.append("venueCode", venueCode);
      blobs.forEach((blob, index) => {
        formData.append("frames", blob, `frame-${index}.jpg`);
      });

      setCaptureError("");

      const submit = isCheckIn ? checkIn : checkOut;
      submit(
        { eventId: numericEventId, formData },
        {
          onSuccess: (response) => {
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
          },
          onError: (error) => {
            const { message } = extractApiErrorMessage(error);
            // The challenge is single-use - pass or fail, it is now spent.
            // Show the server's reason and offer a retry that mints a fresh
            // challenge from the stored venue code.
            setChallenge(null);
            setCaptureError(
              message ||
                "Face verification failed. Make sure you are in good lighting and try again."
            );
          },
        }
      );
    },
    [
      challenge,
      venueCode,
      isCheckIn,
      checkIn,
      checkOut,
      numericEventId,
      eventId,
      navigate,
      resetToScan,
    ]
  );

  // The challenge clock ran out mid-capture: mint a fresh one on request.
  const handleExpired = useCallback(() => {
    setChallenge(null);
    setCaptureError("Time ran out for that attempt. Tap try again when you're ready.");
  }, []);

  // The phone finished the hand-off scan: refresh what this device shows and
  // send the user to the event page, same as an on-device check-in.
  const handlePhoneComplete = useCallback(() => {
    invalidateAfterAttendance(numericEventId);
    const msg = isCheckIn ? "Checked in on your phone!" : "Checked out on your phone!";
    toast.success(msg);
    setStatusMessage({ message: msg, type: "success" });
    redirectTimerRef.current = setTimeout(
      () => navigate(`/dashboard/events/${eventId}`),
      1500
    );
  }, [invalidateAfterAttendance, numericEventId, isCheckIn, navigate, eventId]);

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
            <GuidedLivenessCapture
              actions={challenge?.actions ?? []}
              isSubmitting={isSubmitting}
              errorMessage={captureError}
              expiresAt={challenge?.expiresAt ?? null}
              onComplete={handleFrames}
              onExpired={handleExpired}
              onRetry={restartWithFreshChallenge}
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
              {statusMessage?.type === "success"
                ? "Taking you back to the event..."
                : "Verifying venue code..."}
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

            {/* Continue on a phone instead of this device's camera. */}
            <PairFromPhone
              scope="ATTENDANCE"
              eventId={numericEventId}
              mode={mode}
              onComplete={handlePhoneComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

MarkAttendance.propTypes = {
  type: PropTypes.oneOf(["in", "out"]),
};
