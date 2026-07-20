// src/components/LoginForm.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginForm = ({ form, onSubmit, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full max-w-md">
      {/* Mobile Logo → back to landing */}
      <Link
        to="/"
        className="group lg:hidden flex items-center justify-center gap-3 mb-8"
      >
        <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
          <span className="font-mono text-xs font-bold text-background">B/</span>
        </div>
        <span className="font-display text-2xl font-normal text-foreground tracking-[-0.02em]">
          BeThere
        </span>
      </Link>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {/* Email Input */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail
                        className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 h-11 bg-card"
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-destructive text-xs font-medium" />
              </FormItem>
            )}
          />

          {/* Password Input */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock
                        className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-11 pr-11 h-11 bg-card"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          strokeWidth={1.5}
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          strokeWidth={1.5}
                        />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-destructive text-xs font-medium" />
              </FormItem>
            )}
          />

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground font-medium hover:underline transition duration-200"
              tabIndex={isLoading ? -1 : 0}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full h-11">
            {isLoading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </>
            )}
          </Button>

        </form>
      </Form>
    </div>
  );
};

LoginForm.propTypes = {
  form: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default LoginForm;
