// src/components/FaceScanner.jsx
import PropTypes from "prop-types";
import { useFaceScanner } from "@/hooks/useFaceScanner";
import { useEffect, useState, useRef } from "react";

export default function FaceScanner({
  buttonText = "Scan Face",
  onScanComplete,
  disabled = false,
  externalStatus = null,
}) {
  const {
    videoRef,
    status,
    error,
    result,
    scanStep,
    isInitializing,
    webcamActive,
    startScan,
    reset,
  } = useFaceScanner();

  const [shouldShowInternalError, setShouldShowInternalError] = useState(false);
  const hasEmittedRef = useRef(false);

  useEffect(() => {
    if (scanStep === "idle") {
      hasEmittedRef.current = false;
    }
  }, [scanStep]);

  useEffect(() => {
    if (
      result &&
      scanStep === "complete" &&
      onScanComplete &&
      !hasEmittedRef.current
    ) {
      hasEmittedRef.current = true;
      onScanComplete(result);
    }
  }, [result, scanStep, onScanComplete]);

  // Auto-hide internal error after 5s
  useEffect(() => {
    if (scanStep === "failed" && error) {
      setShouldShowInternalError(true);
      const timer = setTimeout(() => setShouldShowInternalError(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShouldShowInternalError(false);
    }
  }, [scanStep, error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const getButtonState = () => {
    if (isInitializing || !webcamActive || disabled) {
      return {
        text: buttonText,
        disabled: true,
        className: "bg-white/15 text-white/50 cursor-not-allowed",
      };
    }
    if (scanStep === "started") {
      return {
        text: "Processing...",
        disabled: true,
        className: "bg-white/15 text-white cursor-wait",
      };
    }
    if (scanStep === "failed" && shouldShowInternalError) {
      return {
        text: "Retry Scan",
        disabled: false,
        className: "bg-[#fafafa] text-[#2b2b2b] hover:bg-white",
      };
    }
    if (scanStep === "complete") {
      return {
        text: "Scan Again",
        disabled: false,
        className: "bg-[#dcf5e9] text-[#1a7f53] hover:bg-[#c9efdc]",
      };
    }
    return {
      text: buttonText,
      disabled: false,
      className: "bg-[#fafafa] text-[#2b2b2b] hover:bg-white",
    };
  };

  const handleClick = () => {
    hasEmittedRef.current = false;
    reset(); // Reset internal state
    startScan();
  };

  const renderStatusIndicator = () => {
    let bgColor = "bg-card border-border";
    let textColor = "text-foreground";
    let displayStatus = status;
    let showRefreshButton = false;

    if ((scanStep === "failed" || error) && shouldShowInternalError) {
      bgColor = "bg-destructive/10 border-destructive/20";
      textColor = "text-destructive";
      displayStatus = error || status;
      showRefreshButton = true;
    } else if (externalStatus) {
      displayStatus = externalStatus.message || externalStatus;
      const type = externalStatus.type;
      if (type === "loading" || type === "info") {
        bgColor = "bg-card border-border";
        textColor = "text-muted-foreground";
      } else if (type === "success") {
        bgColor = "bg-[#dcf5e9] border-[#1a7f53]/20";
        textColor = "text-[#1a7f53]";
      } else if (type === "error") {
        bgColor = "bg-destructive/10 border-destructive/20";
        textColor = "text-destructive";
      } else if (type === "warning") {
        bgColor = "bg-amber-50 border-amber-200";
        textColor = "text-amber-700";
      }
    } else if (!webcamActive && !isInitializing) {
      bgColor = "bg-destructive/10 border-destructive/20";
      textColor = "text-destructive";
      displayStatus = "Webcam not active. Please allow camera access.";
    } else if (isInitializing) {
      bgColor = "bg-card border-border";
      textColor = "text-muted-foreground";
      displayStatus = "Loading models...";
    } else if (scanStep === "started") {
      bgColor = "bg-card border-border";
      textColor = "text-muted-foreground";
    } else if (scanStep === "complete") {
      bgColor = "bg-[#dcf5e9] border-[#1a7f53]/20";
      textColor = "text-[#1a7f53]";
    }

    return (
      <div
        className={`text-center font-medium p-4 mt-4 border ${bgColor} ${textColor} rounded-xl transition-all duration-300`}
      >
        <p>{displayStatus}</p>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors font-mono text-xs font-bold uppercase tracking-tight"
          >
            Refresh to Scan Again
          </button>
        )}
      </div>
    );
  };

  const renderFaceOverlay = () => {
    if (!webcamActive) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-80">
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#fafafa]/80 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#fafafa]/80 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#fafafa]/80 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#fafafa]/80 rounded-br-lg"></div>

          {scanStep === "started" && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-0.5 bg-[#fafafa]/70 animate-scan"></div>
            </div>
          )}

          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
              <div
                className={`w-2 h-2 rounded-full ${
                  scanStep === "started"
                    ? "bg-[#fafafa] animate-pulse"
                    : scanStep === "complete"
                    ? "bg-[#8ce0b6]"
                    : scanStep === "failed"
                    ? "bg-red-400"
                    : "bg-[#fafafa]/60"
                }`}
              ></div>
              <span className="text-white font-mono text-[10px] font-bold uppercase tracking-tight">
                {scanStep === "started"
                  ? "Scanning..."
                  : scanStep === "complete"
                  ? "Complete"
                  : scanStep === "failed"
                  ? "Failed"
                  : "Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const button = getButtonState();

  return (
    <div className="w-full max-w-2xl">
      <div
        className="bg-[#2b2b2b] p-6 rounded-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(250,250,250,0.10) 1px, transparent 1px)",
          backgroundSize: "7px 7px",
        }}
      >
        <div className="relative bg-black rounded-xl overflow-hidden mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-80 object-cover"
          />
          {renderFaceOverlay()}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#fafafa]/30"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#fafafa]/30"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#fafafa]/30"></div>
        </div>

        <button
          onClick={handleClick}
          className={`w-full py-3.5 px-6 rounded-full font-mono text-sm font-bold uppercase tracking-tight transition-colors duration-300 ${button.className}`}
          disabled={button.disabled}
        >
          <span className="flex items-center justify-center gap-2">
            {scanStep === "started" && (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {button.text}
          </span>
        </button>
      </div>

      {renderStatusIndicator()}

      {webcamActive &&
        scanStep === "idle" &&
        !externalStatus &&
        !shouldShowInternalError && (
          <div className="mt-4 p-4 bg-card border border-border rounded-xl">
            <h3 className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground mb-2">
              Instructions
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Position your face within the frame</li>
              <li>• Ensure good lighting conditions</li>
              <li>• Look directly at the camera</li>
              <li>• Remove glasses if possible for better accuracy</li>
            </ul>
          </div>
        )}
    </div>
  );
}

FaceScanner.propTypes = {
  buttonText: PropTypes.string,
  onScanComplete: PropTypes.func,
  disabled: PropTypes.bool,
  externalStatus: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["loading", "success", "error", "warning", "info"]),
    }),
  ]),
};
