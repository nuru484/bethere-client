// src/pages/AddUserFaceScan.jsx
import { useCallback, useRef, useState } from "react";
import { useAddFaceScan } from "@/hooks/useFaceScanApi";
import FaceScanner from "@/components/FaceScanner";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { UserCircle, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Navigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AddUserFaceScan() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Biometric consent is required by the server: the enrollment payload must
  // carry consent: true, and the scanner stays disabled until it is ticked.
  const [consent, setConsent] = useState(false);

  const hasSubmittedRef = useRef(false);
  const {
    mutate: addFaceScan,
    isPending,
    isSuccess,
    isError,
    error,
  } = useAddFaceScan();

  const handleScanComplete = useCallback(
    (result) => {
      if (result.success && consent && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true;

        addFaceScan(
          {
            faceScan: result.descriptor,
            consent: true,
          },
          {
            onSuccess: (response) => {
              toast.success(
                response?.message || "Face registered successfully!"
              );

              if (response.data.user) {
                login(response.data.user);
              }
              navigate(`/dashboard`);
            },
            onError: (err) => {
              toast.error(err?.message || "Failed to register face.");
              hasSubmittedRef.current = false;
            },
          }
        );
      }
    },
    [addFaceScan, consent, login, navigate]
  );

  const { message } = extractApiErrorMessage(error);

  const getExternalStatus = () => {
    if (isPending) {
      return {
        message: "Registering face...",
        type: "loading",
      };
    }
    if (isSuccess) {
      return {
        message: "Face registered successfully!",
        type: "success",
      };
    }
    if (isError) {
      return {
        message: message || "Failed to register face.",
        type: "error",
      };
    }
    return null;
  };

  // Self-enrollment is attendant-only: admins do not enroll their own face.
  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

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
              Face Registration
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              Register your biometric data for event authentication
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Side Card (Hidden on Mobile) */}
          <div className="hidden lg:block">
            {/* Important Notice */}
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
                    You can only register one face scan. After adding your face
                    scan, you will need to contact an administrator to reset it
                    before you can add a new one.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Face Scanner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile Card - Shown only on small screens */}
            <div className="lg:hidden">
              {/* Important Notice */}
              <div className="bg-card border border-border p-4 rounded-xl">
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
                      You can only register one face scan. After adding your
                      face scan, you will need to contact an administrator to
                      reset it before you can add a new one.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biometric consent - required before enrollment */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="biometric-consent"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="biometric-consent"
                  className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
                >
                  I consent to my facial biometric data being captured and stored
                  to verify my attendance. It is encrypted and can be deleted on
                  request.
                </Label>
              </div>
            </div>

            {/* Face Scanner Component - Centered */}
            <div className="flex justify-center">
              <FaceScanner
                buttonText="Register Face"
                onScanComplete={handleScanComplete}
                disabled={isPending || !consent}
                externalStatus={getExternalStatus()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
