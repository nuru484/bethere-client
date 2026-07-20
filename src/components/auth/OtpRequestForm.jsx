// src/components/auth/OtpRequestForm.jsx
//
// Passwordless login, step 1: an identifier (phone or email) that requests
// a one-time code. Styled to match the login page.
import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, AtSign } from "lucide-react";

const OtpRequestForm = ({ onSubmit, onBack, isLoading = false }) => {
  const [identifier, setIdentifier] = useState("");
  const trimmed = identifier.trim();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
          Sign in with a code
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your phone number or email and we will send you a one-time
          sign-in code.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <label
            htmlFor="otp-identifier"
            className="block font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground mb-2"
          >
            Phone or Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <AtSign
                className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors"
                strokeWidth={1.5}
              />
            </div>
            <Input
              id="otp-identifier"
              type="text"
              placeholder="Enter your phone number or email"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={isLoading}
              className="w-full pl-11 pr-4 h-11 bg-card"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!trimmed || isLoading}
          className="w-full h-11"
        >
          {isLoading ? (
            <span>Sending Code...</span>
          ) : (
            <>
              <span>Send Code</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to password sign in
        </button>
      </form>
    </div>
  );
};

OtpRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default OtpRequestForm;
