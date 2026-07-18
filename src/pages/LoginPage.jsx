// src/pages/LoginPage.jsx
//
// Orchestrates the login flows. Auth is cookie-only: successful responses
// carry { data: { user } } while the tokens ride in httpOnly cookies.
// Steps: password -> (optional 2FA code), or the passwordless OTP flow
// (identifier -> code) for attendants.
import { useLogin, useOtpRequest, useOtpVerify } from "@/hooks/useAuth";
import LoginForm from "@/components/LoginForm";
import TwoFactorStep from "@/components/auth/TwoFactorStep";
import OtpRequestForm from "@/components/auth/OtpRequestForm";
import CodeForm from "@/components/auth/CodeForm";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { loginFormSchema } from "@/validation/login-validation";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const STEPS = {
  PASSWORD: "password",
  TWO_FACTOR: "twoFactor",
  OTP_REQUEST: "otpRequest",
  OTP_CODE: "otpCode",
};

const LoginPage = () => {
  usePageTitle("Login");
  const { mutate: login, isPending } = useLogin();
  const { mutate: requestOtp, isPending: isOtpRequestPending } =
    useOtpRequest();
  const { mutate: verifyOtp, isPending: isOtpVerifyPending } = useOtpVerify();
  const { user, login: logUserIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.PASSWORD);
  const [twoFactorChannel, setTwoFactorChannel] = useState(null);
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpChannel, setOtpChannel] = useState(null);

  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Shared tail of every flow: cookies are already set, the body carries
  // only the user.
  const completeLogin = (response) => {
    toast.success(response.message || "Login Successful");
    logUserIn(response.data.user);
    navigate("/dashboard", { replace: true });
  };

  const onSubmit = async (data) => {
    login(data, {
      onSuccess: (response) => {
        if (response.data?.twoFactorRequired) {
          setTwoFactorChannel(response.data.channel ?? null);
          setStep(STEPS.TWO_FACTOR);
          toast.success(
            response.message || "Enter the verification code we sent you."
          );
          return;
        }

        completeLogin(response);
      },

      onError: (err) => {
        const { message, fieldErrors, hasFieldErrors } =
          extractApiErrorMessage(err);

        if (hasFieldErrors && fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, errorMessage]) => {
            form.setError(field, {
              message: errorMessage,
            });
          });
        }

        if (!hasFieldErrors || message) {
          toast.error(message || "Login failed. Please try again.");
        }
      },
    });
  };

  const backToPassword = () => {
    setStep(STEPS.PASSWORD);
    setTwoFactorChannel(null);
    setOtpChannel(null);
    setOtpIdentifier("");
  };

  const handleTwoFactorExpired = (message) => {
    toast.error(message);
    backToPassword();
  };

  const handleOtpRequest = (identifier) => {
    requestOtp(
      { identifier },
      {
        onSuccess: (response) => {
          // Enumeration-safe endpoint: always proceeds to the code step.
          setOtpIdentifier(identifier);
          setOtpChannel(response.data?.channel ?? null);
          setStep(STEPS.OTP_CODE);
          toast.success(
            response.message || "If that account exists, a code is on its way."
          );
        },
        onError: (err) => {
          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Could not send a code. Please try again.");
        },
      }
    );
  };

  const handleOtpVerify = (code) => {
    verifyOtp(
      { identifier: otpIdentifier, code },
      {
        onSuccess: completeLogin,
        onError: (err) => {
          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Invalid code. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-green-50 font-sans antialiased">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          {/* Logo → back to landing */}
          <Link to="/" className="group mb-8 flex w-fit items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img
                src={"/assets/logo.png"}
                alt="BeThere Logo"
                className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              BeThere
            </span>
          </Link>

          <div className="mt-16">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Modern Attendance
              <br />
              Management System
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed max-w-md">
              Streamline your attendance tracking with our intelligent, secure,
              and easy-to-use platform designed for modern organizations.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Steps */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {step === STEPS.PASSWORD && (
          <div className="w-full max-w-md space-y-6">
            <LoginForm form={form} onSubmit={onSubmit} isLoading={isPending} />

            {/* Passwordless option (attendants) */}
            <button
              type="button"
              onClick={() => setStep(STEPS.OTP_REQUEST)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition duration-200 disabled:opacity-70"
            >
              <KeyRound className="h-4 w-4" />
              Sign in with a code instead
            </button>
          </div>
        )}

        {step === STEPS.TWO_FACTOR && (
          <TwoFactorStep
            channel={twoFactorChannel}
            onSuccess={completeLogin}
            onExpired={handleTwoFactorExpired}
            onBack={backToPassword}
          />
        )}

        {step === STEPS.OTP_REQUEST && (
          <OtpRequestForm
            onSubmit={handleOtpRequest}
            onBack={backToPassword}
            isLoading={isOtpRequestPending}
          />
        )}

        {step === STEPS.OTP_CODE && (
          <CodeForm
            title="Enter your sign-in code"
            channel={otpChannel}
            onSubmit={handleOtpVerify}
            onBack={() => setStep(STEPS.OTP_REQUEST)}
            isLoading={isOtpVerifyPending}
            submitLabel="Verify and Sign In"
            backLabel="Use a different phone or email"
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
