// src/components/auth/CodeForm.jsx
//
// Presentational 6-digit verification code form, styled to match the
// login page. Shared by the 2FA login step, the passwordless OTP login
// step and the profile security 2FA toggle dialog.
import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";

const CODE_LENGTH = 6;

const channelLabel = (channel) => {
  if (channel === "SMS") return "your phone";
  if (channel === "EMAIL") return "your email";
  return "you";
};

const CodeForm = ({
  onSubmit,
  onBack,
  isLoading = false,
  title = "Enter verification code",
  channel = null,
  submitLabel = "Verify Code",
  backLabel = "Back",
}) => {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef([]);

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  const setDigit = (index, value) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "");

    // Pasting or autofill of the whole code into one box.
    if (value.length > 1) {
      const pasted = value.slice(0, CODE_LENGTH).split("");
      setDigits(
        Array(CODE_LENGTH)
          .fill("")
          .map((_, i) => pasted[i] || "")
      );
      const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    setDigit(index, value);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isComplete && !isLoading) {
      onSubmit(code);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#2b2b2b] flex items-center justify-center mb-4">
          <ShieldCheck className="h-7 w-7 text-[#fafafa]" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-normal tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a {CODE_LENGTH}-digit code to {channelLabel(channel)}. Enter
          it below to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div
          className="flex justify-center gap-2 sm:gap-3"
          role="group"
          aria-label="Verification code"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              disabled={isLoading}
              aria-label={`Digit ${index + 1}`}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl rounded-xl border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all duration-200 text-foreground bg-card disabled:opacity-70"
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={!isComplete || isLoading}
          className="w-full h-11"
        >
          {isLoading ? (
            <span>Verifying...</span>
          ) : (
            <>
              <span>{submitLabel}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </>
          )}
        </Button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-70"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            {backLabel}
          </button>
        )}
      </form>
    </div>
  );
};

CodeForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  isLoading: PropTypes.bool,
  title: PropTypes.string,
  channel: PropTypes.oneOf(["SMS", "EMAIL", null]),
  submitLabel: PropTypes.string,
  backLabel: PropTypes.string,
};

export default CodeForm;
