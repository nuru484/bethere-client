// src/components/attendance/MarkAttendance.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCreateAttendance,
  useUpdateAttendance,
} from "@/hooks/useAttendance";
import FaceScanner from "@/components/FaceScanner";
import { useAuth } from "@/hooks/useAuth";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { LogIn, LogOut, ArrowLeft, MapPin } from "lucide-react";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { Button } from "@/components/ui/button";

export default function MarkAttendance({ type = "in" }) {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const watchIdRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const toastIdRef = useRef(null);

  const { mutate: createAttendance, isPending: isCreating } =
    useCreateAttendance();
  const { mutate: updateAttendance, isPending: isUpdating } =
    useUpdateAttendance();

  const isMarking = type === "in" ? isCreating : isUpdating;
  const markAttendance = type === "in" ? createAttendance : updateAttendance;

  // Start watching location
  const startWatchingLocation = useCallback(() => {
    setLocationError("");
    setLatitude(null);
    setLongitude(null);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationError("");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError("Please enable location services to mark attendance.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }, []);

  // Check and request location permission
  const checkLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "denied") {
        setLocationError(
          "Location access is disabled. Please enable location services in your browser settings to mark attendance."
        );
      } else if (result.state === "prompt" || result.state === "granted") {
        startWatchingLocation();
      }
    });
  }, [startWatchingLocation]);

  useEffect(() => {
    checkLocationPermission();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkLocationPermission]);

  const handleScanComplete = useCallback(
    async (scanResult) => {
      if (hasSubmittedRef.current) return;
      if (!scanResult || !scanResult.descriptor) {
        toast.error("Invalid face scan result.");
        return;
      }

      if (!latitude || !longitude) {
        const locMsg =
          "Location is required to mark attendance. Please enable location services.";
        toast.error(locMsg);
        setVerificationStatus({ message: locMsg, type: "error" });
        return;
      }

      setIsVerifying(true);
      toastIdRef.current = toast.loading("Verifying face...");
      hasSubmittedRef.current = true;
      setVerificationStatus({
        message: `Verifying face and marking attendance ${type}...`,
        type: "loading",
      });

      // The server verifies the live descriptor against the enrolled face
      // scan and marks attendance in one call.
      markAttendance(
        {
          eventId: parseInt(eventId),
          attendanceData: {
            latitude,
            longitude,
            faceDescriptor: Array.from(scanResult.descriptor),
          },
        },
        {
          onSuccess: (response) => {
            const msg =
              response?.message || `Attendance ${type} marked successfully!`;
            toast.success(msg, { id: toastIdRef.current });
            setVerificationStatus({ message: msg, type: "success" });
            setIsVerifying(false);
            setTimeout(() => navigate(`/dashboard/events/${eventId}`), 2000);
          },
          onError: (error) => {
            const { message } = extractApiErrorMessage(error);
            const errMsg = message || `Failed to mark attendance ${type}.`;
            toast.error(errMsg, { id: toastIdRef.current });
            setVerificationStatus({ message: errMsg, type: "error" });
            setIsVerifying(false);
            hasSubmittedRef.current = false;
          },
        }
      );
    },
    [latitude, longitude, markAttendance, eventId, type, navigate]
  );

  const getExternalStatus = () => {
    if (locationError) return { message: locationError, type: "error" };
    if (verificationStatus) return verificationStatus;
    return null;
  };

  const isCheckIn = type === "in";
  const Icon = isCheckIn ? LogIn : LogOut;
  const gradientColors = isCheckIn
    ? "from-green-500 to-green-600"
    : "from-orange-500 to-orange-600";

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-0">
          <div className="flex justify-end sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 h-8"
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div
                className={`w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${gradientColors} flex items-center justify-center shadow-sm`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                  Mark Attendance {isCheckIn ? "In" : "Out"}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-1.5 leading-snug">
                  {isCheckIn
                    ? "Check in to the event with face verification"
                    : "Check out from the event with face verification"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="hidden sm:flex border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="hidden lg:flex lg:flex-col gap-6">
            {latitude && longitude && !locationError && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg h-fit">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-800">
                      Location Detected
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your location has been successfully captured and will be
                      recorded with your attendance.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg h-fit">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">
                    Before You Scan
                  </h3>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Ensure you have a registered face scan</li>
                    <li>• Allow camera and location permissions</li>
                    <li>• Position your face clearly in the camera frame</li>
                    <li>• Ensure good lighting for accurate verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Face Scanner */}
          <div className="lg:col-span-2 space-y-6">
            <div className="lg:hidden space-y-4">
              {latitude && longitude && !locationError && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-800">
                        Location Detected
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your location has been successfully captured and will be
                        recorded with your attendance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">
                      Before You Scan
                    </h3>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Ensure you have a registered face scan</li>
                      <li>• Allow camera and location permissions</li>
                      <li>• Position your face clearly in the camera frame</li>
                      <li>• Ensure good lighting for accurate verification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <FaceScanner
                buttonText={`Scan Face to Mark ${
                  isCheckIn ? "Check-In" : "Check-Out"
                }`}
                onScanComplete={handleScanComplete}
                disabled={
                  isVerifying ||
                  isMarking ||
                  !user?.id ||
                  hasSubmittedRef.current
                }
                externalStatus={getExternalStatus()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MarkAttendance.propTypes = {
  type: PropTypes.oneOf(["in", "out"]),
};
