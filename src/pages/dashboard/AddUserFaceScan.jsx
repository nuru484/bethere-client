// src/pages/dashboard/AddUserFaceScan.jsx
import { useCallback, useEffect, useState } from "react";
import {
  useRequestEnrollmentChallenge,
  useAddFaceScan,
} from "@/hooks/useFaceScanApi";
import GuidedLivenessCapture from "@/components/attendance/GuidedLivenessCapture";
import PairFromPhone from "@/components/attendance/PairFromPhone";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { UserCircle, TriangleAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Navigate, Link } from "react-router";
import { loadFaceLandmarker, preloadFaceLandmarker } from "@/lib/face-landmarker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Guided one-take enrollment, mirroring check-in:
//  consent    -> tick biometric consent, then request a liveness challenge
//  requesting -> waiting for the challenge
//  capture    -> the on-device guide prompts every challenged action in order
//                and ONE upload lets the server verify the burst and derive
//                the face template
//  enrolled   -> terminal: a template already exists and only an admin can
//                reset it, so there is nothing to retry here
const STAGE = {
  CONSENT: "consent",
  REQUESTING: "requesting",
  CAPTURE: "capture",
  ENROLLED: "enrolled",
};

// The server refuses enrollment with 409 once a template exists. It carries
// no machine-readable code, so the status is the signal.
const isAlreadyEnrolled = (error) => error?.status === 409;

// The server's minimum usable batch size.
const MIN_BATCH_FRAMES = 6;

export default function AddUserFaceScan() {
  const { login, updateUser, user } = useAuth();
  const navigate = useNavigate();

  // Biometric consent is required by the server: the enrollment upload must
  // carry consent, and nothing starts until it is ticked.
  const [consent, setConsent] = useState(false);
  // A bookmark or the back button can land an already-enrolled user here, so
  // the terminal state is decided up front rather than only on a 409.
  const [stage, setStage] = useState(() =>
    user?.hasFaceScan === true ? STAGE.ENROLLED : STAGE.CONSENT
  );
  const [challenge, setChallenge] = useState(null); // { token, actions, expiresAt }
  const [captureError, setCaptureError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  // Warm the on-device face guide during consent so the challenge TTL never
  // waits on a model download.
  useEffect(() => {
    preloadFaceLandmarker();
  }, []);

  const { mutate: requestChallenge, isPending: isRequestingChallenge } =
    useRequestEnrollmentChallenge();
  const { mutate: addFaceScan, isPending: isSubmitting } = useAddFaceScan();

  // Challenges are single-use, so a failed attempt always starts over and asks
  // for a fresh one.
  const resetToConsent = useCallback(() => {
    setStage(STAGE.CONSENT);
    setChallenge(null);
    setCaptureError("");
  }, []);

  const handleStart = useCallback(() => {
    setStage(STAGE.REQUESTING);
    setStatusMessage(null);
    setCaptureError("");

    // Model first: its download must not eat into the challenge TTL.
    loadFaceLandmarker()
      .catch(() => undefined)
      .then(() => {
        requestChallenge(undefined, {
          onSuccess: (response) => {
            const data = response?.data || {};
            if (!data.challengeToken || !Array.isArray(data.actions)) {
              toast.error("Could not start face registration. Please try again.");
              resetToConsent();
              return;
            }
            setChallenge({
              token: data.challengeToken,
              actions: data.actions,
              expiresAt: data.expiresAt ?? null,
            });
            setStage(STAGE.CAPTURE);
          },
          onError: (error) => {
            // Retrying an already-enrolled user can never succeed: send them to
            // the terminal state instead of looping them back to Continue.
            if (isAlreadyEnrolled(error)) {
              setStatusMessage(null);
              setStage(STAGE.ENROLLED);
              return;
            }

            const { message } = extractApiErrorMessage(error);
            const errMsg = message || "Could not start face registration.";
            toast.error(errMsg);
            setStatusMessage({ message: errMsg, type: "error" });
            resetToConsent();
          },
        });
      });
  }, [requestChallenge, resetToConsent]);

  // The guided capture finished every action: one upload verifies the burst
  // and stores the template.
  const handleFrames = useCallback(
    (blobs) => {
      if (!challenge?.token) {
        toast.error("Your session expired. Please start again.");
        resetToConsent();
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
      formData.append("consent", "true");
      blobs.forEach((blob, index) => {
        formData.append("frames", blob, `frame-${index}.jpg`);
      });

      setCaptureError("");

      addFaceScan(formData, {
        onSuccess: (response) => {
          const data = response?.data || {};
          const msg = response?.message || "Face registered successfully!";
          toast.success(msg);
          setStatusMessage({ message: msg, type: "success" });
          if (data.user) login(data.user);
          navigate(`/dashboard`);
        },
        onError: (error) => {
          if (isAlreadyEnrolled(error)) {
            setStatusMessage(null);
            setStage(STAGE.ENROLLED);
            return;
          }
          const { message } = extractApiErrorMessage(error);
          // The challenge is spent either way; the retry button mints a new
          // one without bouncing through the consent screen.
          setChallenge(null);
          setCaptureError(
            message ||
              "We couldn't verify that scan. Make sure you are in good lighting and try again."
          );
        },
      });
    },
    [addFaceScan, challenge, login, navigate, resetToConsent]
  );

  const handleExpired = useCallback(() => {
    setChallenge(null);
    setCaptureError("Time ran out for that attempt. Tap try again when you're ready.");
  }, []);

  // The phone finished enrolling: reflect it in this device's session and go to
  // the terminal "already registered" state.
  const handlePhoneComplete = useCallback(() => {
    updateUser({ hasFaceScan: true });
    toast.success("Face registered on your phone!");
    setStatusMessage(null);
    setStage(STAGE.ENROLLED);
  }, [updateUser]);

  // Self-enrollment is attendant-only: admins do not enroll their own face.
  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const statusClasses = {
    success:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    error: "bg-destructive/10 border-destructive/20 text-destructive",
  };

  const notice = (
    <div className="bg-card border border-border p-4 rounded-xl h-fit">
      <div className="flex items-start gap-3">
        <TriangleAlert
          className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
          strokeWidth={1.5}
        />
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
            Important Notice
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            You can only register one face scan. After adding your face scan,
            you will need to contact an administrator to reset it before you can
            add a new one.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-border">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#2b2b2b] flex items-center justify-center">
            <UserCircle
              className="h-5 w-5 sm:h-6 sm:w-6 text-[#fafafa]"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-foreground">
              Face registration
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              Register your biometric data for event authentication
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Side Card (Hidden on Mobile). The "one scan only"
              warning is redundant once the scan exists, so it drops out. */}
          <div className="hidden lg:block">
            {stage !== STAGE.ENROLLED && notice}
          </div>

          {/* Center Column - Consent then capture */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile Card - Shown only on small screens */}
            <div className="lg:hidden">
              {stage !== STAGE.ENROLLED && notice}
            </div>

            {statusMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl border p-4 text-center font-medium ${
                  statusClasses[statusMessage.type] || statusClasses.error
                }`}
              >
                {statusMessage.message}
              </div>
            )}

            {stage === STAGE.ENROLLED ? (
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-400"
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0">
                    <h2 className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
                      Face Already Registered
                    </h2>
                    <p className="mt-2 text-sm leading-snug text-muted-foreground">
                      Your face scan is already on file, so there is nothing to
                      register here. You can use it to check in and out right
                      away. To replace it, ask an administrator to reset your
                      face scan first.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="mt-5 w-full rounded-full py-6 font-mono text-sm font-bold uppercase tracking-tight sm:w-auto sm:px-8"
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : stage === STAGE.CAPTURE ? (
              <div className="flex justify-center">
                <GuidedLivenessCapture
                  actions={challenge?.actions ?? []}
                  isSubmitting={isSubmitting}
                  errorMessage={captureError}
                  expiresAt={challenge?.expiresAt ?? null}
                  onComplete={handleFrames}
                  onExpired={handleExpired}
                  onRetry={handleStart}
                  startLabel="Start face registration"
                />
              </div>
            ) : stage === STAGE.REQUESTING ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-16">
                <div
                  className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
                  role="status"
                  aria-label="Preparing face registration"
                />
                <p className="text-sm text-muted-foreground">
                  Preparing your registration...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Biometric consent - required before enrollment */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="biometric-consent"
                      checked={consent}
                      onCheckedChange={(value) => setConsent(value === true)}
                      disabled={isRequestingChallenge}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="biometric-consent"
                      className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                    >
                      I consent to my facial biometric data being captured and
                      stored to verify my attendance. It is encrypted and can be
                      deleted on request. See how it is handled in the{" "}
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </Label>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
                    Before You Start
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Allow camera permission when prompted</li>
                    <li>• Find a well-lit spot and face the camera</li>
                    <li>• Remove sunglasses or anything covering your face</li>
                    <li>• Follow the on-screen actions as they appear</li>
                  </ul>
                </div>

                <Button
                  type="button"
                  onClick={handleStart}
                  disabled={!consent || isRequestingChallenge}
                  className="w-full rounded-full py-6 font-mono text-sm font-bold uppercase tracking-tight sm:w-auto sm:px-8"
                >
                  {isRequestingChallenge ? "Starting..." : "Continue"}
                </Button>

                {/* Or register from a phone instead of this device's camera.
                    Consent is captured again on the phone. */}
                <PairFromPhone scope="ENROLL" onComplete={handlePhoneComplete} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
