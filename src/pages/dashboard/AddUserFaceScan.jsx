// src/pages/AddUserFaceScan.jsx
import { useCallback, useRef } from "react";
import { useAddFaceScan } from "@/hooks/useFaceScanApi";
import FaceScanner from "@/components/FaceScanner";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AddUserFaceScan() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      if (result.success && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true;

        addFaceScan(
          {
            faceScan: result.descriptor,
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
    [addFaceScan, login, navigate]
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

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
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
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg h-fit">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Important Notice
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
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
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Important Notice
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You can only register one face scan. After adding your
                      face scan, you will need to contact an administrator to
                      reset it before you can add a new one.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Face Scanner Component - Centered */}
            <div className="flex justify-center">
              <FaceScanner
                buttonText="Register Face"
                onScanComplete={handleScanComplete}
                disabled={isPending}
                externalStatus={getExternalStatus()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
