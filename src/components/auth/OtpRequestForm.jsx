// src/components/auth/OtpRequestForm.jsx
//
// Passwordless login, step 1: an identifier (phone or email) that requests
// a one-time code. Styled to match the login page.
import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, KeyRound, AtSign } from "lucide-react";

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
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <KeyRound className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sign in with a code
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your phone number or email and we will send you a one-time
          sign-in code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="otp-identifier"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Phone or Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <AtSign className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
            </div>
            <Input
              id="otp-identifier"
              type="text"
              placeholder="Enter your phone number or email"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3.5 h-auto rounded-xl border-2 border-gray-200 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 bg-white"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!trimmed || isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3.5 px-6 h-auto rounded-xl transition-all duration-200 focus:ring-4 focus:ring-emerald-200 focus:outline-none flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span>Sending Code...</span>
          ) : (
            <>
              <span>Send Code</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-emerald-700 font-medium transition-colors disabled:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
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
