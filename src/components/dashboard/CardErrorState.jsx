// src/components/dashboard/CardErrorState.jsx
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";

const CardErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-tight text-destructive">
        Error
      </p>

      <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
        {message}
      </p>

      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

CardErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

export default CardErrorState;
