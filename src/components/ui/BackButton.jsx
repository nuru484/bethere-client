// src/components/ui/BackButton.jsx
//
// Icon-only back control for dashboard page headers. It steps back through
// in-app history when there is any, and otherwise navigates to `to` so a
// deep-linked or refreshed page never dead-ends on the browser's history.
import PropTypes from "prop-types";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BackButton = ({ to, label, className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    // The entry the browser loaded keeps the key "default"; any other key
    // means the app pushed this location itself and can step back into it.
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(to);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-10 w-10 shrink-0", className)}
      aria-label={label}
      onClick={goBack}
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" />
    </Button>
  );
};

BackButton.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default BackButton;
