// src/components/auth/TwoFactorStep.jsx
//
// Second login step: submits the 6-digit code to POST /auth/login/2fa
// (the short-lived pending cookie proves the password step). On success
// the auth cookies are set and { data: { user } } comes back.
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import CodeForm from "@/components/auth/CodeForm";
import { useVerify2fa } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const TwoFactorStep = ({ channel, onSuccess, onExpired, onBack }) => {
  const { mutate: submitCode, isPending } = useVerify2fa();

  const handleSubmit = (code) => {
    submitCode(
      { code },
      {
        onSuccess: (response) => {
          onSuccess(response);
        },
        onError: (err) => {
          // Pending cookie ran out: restart from the password step.
          if (err?.status === 401 && err?.data?.code === "2FA_PENDING_EXPIRED") {
            onExpired(
              "Your login session expired. Please enter your password again."
            );
            return;
          }

          const { message } = extractApiErrorMessage(err);
          toast.error(message || "Invalid code. Please try again.");
        },
      }
    );
  };

  return (
    <CodeForm
      title="Two-factor verification"
      channel={channel}
      onSubmit={handleSubmit}
      onBack={onBack}
      isLoading={isPending}
      submitLabel="Verify and Sign In"
      backLabel="Back to password"
    />
  );
};

TwoFactorStep.propTypes = {
  channel: PropTypes.oneOf(["SMS", "EMAIL", null]),
  onSuccess: PropTypes.func.isRequired,
  onExpired: PropTypes.func.isRequired,
  onBack: PropTypes.func,
};

export default TwoFactorStep;
