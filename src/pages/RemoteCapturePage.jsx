// src/pages/RemoteCapturePage.jsx
//
// The PHONE side of the "scan from phone" hand-off (public route /pair). The
// phone opens this from the laptop's QR link, authenticates ONLY with the
// hand-off token in the URL, and runs the same guided one-take scan there:
// the on-device guide prompts every challenged action, then ONE upload
// verifies the burst and marks the pairing complete for the laptop's poll.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, TriangleAlert, Check } from "lucide-react";
import QrScanner from "@/components/attendance/QrScanner";
import GuidedLivenessCapture from "@/components/attendance/GuidedLivenessCapture";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  getPairingContext,
  remoteChallenge,
  remoteCapture,
} from "@/api/pairing";
import { loadFaceLandmarker, preloadFaceLandmarker } from "@/lib/face-landmarker";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const STAGE = {
  LOADING: "loading",
  SCAN: "scan",
  CONSENT: "consent",
  REQUESTING: "requesting",
  CAPTURE: "capture",
  DONE: "done",
  ERROR: "error",
};

// The server's minimum usable batch size.
const MIN_BATCH_FRAMES = 6;

export default function RemoteCapturePage() {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get("token"));

  const [context, setContext] = useState(null); // { scope, eventId, mode }
  const [stage, setStage] = useState(STAGE.LOADING);
  const [fatalMessage, setFatalMessage] = useState("");

  const [consent, setConsent] = useState(false);
  const [challenge, setChallenge] = useState(null); // { token, actions, expiresAt }
  const [venueCode, setVenueCode] = useState(null);
  const [captureError, setCaptureError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEnroll = context?.scope === "ENROLL";

  // Warm the on-device face guide immediately: on a phone this page IS the
  // scan, and the short challenge TTL must not wait on a model download.
  useEffect(() => {
    preloadFaceLandmarker();
  }, []);

  // Resolve what this pairing authorizes, then drop into the right first stage.
  useEffect(() => {
    if (!token) {
      setFatalMessage("This link is missing its pairing token. Start again from your laptop.");
      setStage(STAGE.ERROR);
      return;
    }
    let cancelled = false;
    getPairingContext(token)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data || {};
        setContext(data);
        setStage(data.scope === "ENROLL" ? STAGE.CONSENT : STAGE.SCAN);
      })
      .catch((err) => {
        if (cancelled) return;
        const { message } = extractApiErrorMessage(err);
        setFatalMessage(message || "This pairing link is no longer active.");
        setStage(STAGE.ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startChallenge = useCallback(
    (scannedCode) => {
      setStage(STAGE.REQUESTING);
      setCaptureError("");
      // Model in hand BEFORE the challenge clock starts.
      loadFaceLandmarker()
        .catch(() => undefined)
        .then(() => remoteChallenge(token, { venueCode: scannedCode }))
        .then((res) => {
          const data = res?.data || {};
          if (!data.challengeToken || !Array.isArray(data.actions)) {
            toast.error("Could not start the scan.");
            setStage(isEnroll ? STAGE.CONSENT : STAGE.SCAN);
            return;
          }
          setChallenge({
            token: data.challengeToken,
            actions: data.actions,
            expiresAt: data.expiresAt ?? null,
          });
          setStage(STAGE.CAPTURE);
        })
        .catch((err) => {
          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Could not start the scan.");
          // Attendance restarts at the venue scan; enrollment at consent.
          setStage(isEnroll ? STAGE.CONSENT : STAGE.SCAN);
        });
    },
    [token, isEnroll]
  );

  const handleScan = useCallback(
    (scannedCode) => {
      setVenueCode(scannedCode);
      startChallenge(scannedCode);
    },
    [startChallenge]
  );

  // A spent challenge retries with the stored venue code (still valid inside
  // the server's skew window) without demanding another QR scan.
  const restartWithFreshChallenge = useCallback(() => {
    startChallenge(isEnroll ? undefined : venueCode);
  }, [startChallenge, isEnroll, venueCode]);

  // The guided capture finished every action: one upload settles the pairing.
  const handleFrames = useCallback(
    (blobs) => {
      if (!challenge?.token) {
        toast.error("Your session expired. Start again from your laptop.");
        setFatalMessage("Your pairing session expired.");
        setStage(STAGE.ERROR);
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
      if (isEnroll) formData.append("consent", "true");
      else formData.append("venueCode", venueCode);
      blobs.forEach((blob, index) => {
        formData.append("frames", blob, `frame-${index}.jpg`);
      });

      setCaptureError("");
      setIsSubmitting(true);
      remoteCapture(token, formData)
        .then(() => {
          setStage(STAGE.DONE);
        })
        .catch((err) => {
          const { message } = extractApiErrorMessage(err);
          // The challenge is spent either way; the retry mints a fresh one.
          setChallenge(null);
          setCaptureError(
            message ||
              "We couldn't verify that scan. Make sure you are in good lighting and try again."
          );
        })
        .finally(() => setIsSubmitting(false));
    },
    [challenge, venueCode, isEnroll, token]
  );

  const handleExpired = useCallback(() => {
    setChallenge(null);
    setCaptureError("Time ran out for that attempt. Tap try again when you're ready.");
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-5">
        <div className="text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            BeThere
          </p>
          <h1 className="mt-1 font-display text-xl font-normal tracking-[-0.02em] text-foreground">
            {isEnroll ? "Register your face" : "Verify your attendance"}
          </h1>
        </div>

        {stage === STAGE.LOADING && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Opening your scan...</p>
          </div>
        )}

        {stage === STAGE.ERROR && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-destructive" strokeWidth={1.5} />
            <p className="text-sm text-destructive">{fatalMessage}</p>
          </div>
        )}

        {stage === STAGE.CONSENT && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="remote-consent"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="remote-consent"
                  className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                >
                  I consent to my facial biometric data being captured and stored
                  to verify my attendance. It is encrypted and can be deleted on
                  request.
                </Label>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => startChallenge()}
              disabled={!consent}
              className="w-full rounded-full py-6 font-mono text-sm font-bold uppercase tracking-tight"
            >
              Continue
            </Button>
          </div>
        )}

        {stage === STAGE.SCAN && context && (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Point your camera at the venue code on the screen.
            </p>
            <div className="flex justify-center">
              <QrScanner eventId={context.eventId} onScan={handleScan} />
            </div>
          </div>
        )}

        {stage === STAGE.REQUESTING && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Starting your scan...</p>
          </div>
        )}

        {stage === STAGE.CAPTURE && (
          <div className="flex justify-center">
            <GuidedLivenessCapture
              actions={challenge?.actions ?? []}
              isSubmitting={isSubmitting}
              errorMessage={captureError}
              expiresAt={challenge?.expiresAt ?? null}
              onComplete={handleFrames}
              onExpired={handleExpired}
              onRetry={restartWithFreshChallenge}
              startLabel="Start scan"
            />
          </div>
        )}

        {stage === STAGE.DONE && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="font-display text-lg text-emerald-700 dark:text-emerald-400">
              All done!
            </h2>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              You can return to your laptop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
