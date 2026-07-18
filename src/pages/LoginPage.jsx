// src/pages/LoginPage.jsx
import { useLogin } from "@/hooks/useAuth";
import LoginForm from "@/components/LoginForm";
import encryptStorage from "@/lib/encryptedStorage";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema } from "@/validation/login-validation";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const LoginPage = () => {
  usePageTitle("Login");
  const { mutate: login, isPending } = useLogin();
  const { user, login: logUserIn } = useAuth();
  const navigate = useNavigate();

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

  const onSubmit = async (data) => {
    login(data, {
      onSuccess: (response) => {
        // Server envelope: { message, data: { accessToken, refreshToken, user } }
        const { accessToken, refreshToken, user: loggedInUser } = response.data;

        toast.success(response.message || "Login Successful");
        logUserIn(loggedInUser);
        encryptStorage.setItem("accessToken", accessToken);
        encryptStorage.setItem("refreshToken", refreshToken);
        navigate("/dashboard", { replace: true });
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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <LoginForm form={form} onSubmit={onSubmit} isLoading={isPending} />
      </div>
    </div>
  );
};

export default LoginPage;
