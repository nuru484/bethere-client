// src/pages/LoginPage.jsx
//
// Orchestrates the login flows. Auth is cookie-only: successful responses
// carry { data: { user } } while the tokens ride in httpOnly cookies.
// Steps: password -> (optional 2FA code), or the passwordless OTP flow
// (identifier -> code) for attendants.
import { useLogin, useOtpRequest, useOtpVerify } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { demoLogin } from "@/api/auth";
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
import { KeyRound, ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
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

  // Portfolio demo sign-in: no credentials live in the client, the server
  // mints the session. `variables` tells us which role button is pending.
  const {
    mutate: startDemoLogin,
    isPending: isDemoPending,
    variables: demoRole,
  } = useMutation({ mutationFn: demoLogin });

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

  const handleDemoLogin = (role) => {
    startDemoLogin(role, {
      onSuccess: completeLogin,
      onError: (err) => {
        const { message } = extractApiErrorMessage(err);
        toast.error(message || "Demo login is unavailable right now.");
      },
    });
  };

  const onSubmit = async (data) => {
    login(data, {
      onSuccess: (response) => {
        if (response.data?.twoFactorRequired) {
          setTwoFactorChannel(response.data.channel ?? null);
          setStep(STEPS.TWO_FACTOR);
          toast.success(
            response.message || "Enter the verification code we sent you.",
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
            response.message || "If that account exists, a code is on its way.",
          );
        },
        onError: (err) => {
          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Could not send a code. Please try again.");
        },
      },
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
      },
    );
  };

  return (
    // Backgrounds run edge to edge on any screen; only the CONTENT inside
    // each half is capped and centered, so nothing drifts into far corners
    // on ultra-wide displays.
    <div className="min-h-screen bg-background antialiased">
      <div className="flex min-h-screen w-full">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div
          className="hidden lg:flex lg:w-1/2 bg-muted p-12 flex-col justify-between relative overflow-hidden border-r border-border"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(43,43,43,0.10) 1px, transparent 1px)",
            backgroundSize: "7px 7px",
          }}
        >
          <div className="relative z-10 mx-auto w-full max-w-xl">
            {/* Logo → back to landing */}
            <Link to="/" className="group mb-8 flex w-fit items-center gap-3">
              <div className="w-11 h-11 bg-foreground rounded-xl flex items-center justify-center">
                <span className="font-mono text-sm font-bold text-background">
                  B/
                </span>
              </div>
              <span className="font-display text-3xl font-normal text-foreground tracking-[-0.02em]">
                BeThere
              </span>
            </Link>

            <div className="mt-16">
              <p className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground mb-4">
                Attendance, on the record
              </p>
              <h2 className="font-display font-normal tracking-[-0.02em] text-5xl text-foreground mb-6 leading-tight">
                Modern Attendance
                <br />
                Management System
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Streamline your attendance tracking with our intelligent,
                secure, and easy-to-use platform designed for modern
                organizations.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Steps */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
          {/* Top bar: back to landing + theme toggle (reachable on every screen) */}
          <div className="absolute inset-x-4 top-4 flex items-center justify-between lg:inset-x-6 lg:top-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              Back to home
            </Link>
            <ThemeToggle />
          </div>
          {step === STEPS.PASSWORD && (
            <div className="w-full max-w-md space-y-6">
              <LoginForm
                form={form}
                onSubmit={onSubmit}
                isLoading={isPending}
              />

              {/* Passwordless option (attendants) */}
              <button
                type="button"
                onClick={() => setStep(STEPS.OTP_REQUEST)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium hover:underline transition duration-200 disabled:opacity-70"
              >
                <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                Sign in with a code instead
              </button>

              {/* Portfolio demo: server-side sessions, no credentials in the
                  client. Lets recruiters explore either role in one click. */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                    Or explore the demo
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => handleDemoLogin("ADMIN")}
                    disabled={isDemoPending || isPending}
                  >
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                    {isDemoPending && demoRole === "ADMIN"
                      ? "Signing In..."
                      : "Try Admin Demo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => handleDemoLogin("USER")}
                    disabled={isDemoPending || isPending}
                  >
                    <UserRound className="h-4 w-4" strokeWidth={1.5} />
                    {isDemoPending && demoRole === "USER"
                      ? "Signing In..."
                      : "Try Attendant Demo"}
                  </Button>
                </div>
              </div>
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
    </div>
  );
};

export default LoginPage;
