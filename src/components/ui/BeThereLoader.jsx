// src/components/ui/BeThereLoader.jsx
//
// The app's signature loading indicator: the B/ mark with mint "presence scan"
// rings pulsing outward (a nod to the liveness/venue-code check) and a thin
// sweeping arc. Compact by design - it fills whatever box it's placed in, it
// does not take over the page. CSS keyframes live in index.css and respect
// prefers-reduced-motion. The accent uses the chart-1 (mint) data colour.
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const ACCENT = "hsl(var(--chart-1))";
const ACCENT_SOFT = "hsl(var(--chart-1) / 0.55)";

const BeThereLoader = ({ label, className }) => (
  <div
    className={cn("flex flex-col items-center justify-center gap-3", className)}
    role="status"
    aria-label={label || "Loading"}
  >
    <div className="relative grid size-16 place-items-center">
      {/* pulsing presence rings (staggered) */}
      <span className="bethere-ping absolute inset-0 rounded-full border-2" style={{ borderColor: ACCENT_SOFT }} />
      <span
        className="bethere-ping absolute inset-0 rounded-full border-2"
        style={{ borderColor: ACCENT_SOFT, animationDelay: "0.9s" }}
      />
      {/* sweeping arc */}
      <span
        className="bethere-sweep absolute inset-1.5 rounded-full border-2 border-transparent"
        style={{ borderTopColor: ACCENT }}
      />
      {/* the B/ mark */}
      <span className="bethere-lift relative flex size-9 items-center justify-center rounded-xl bg-foreground font-mono text-sm font-bold text-background">
        B/
      </span>
    </div>
    {label && (
      <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        {label}
      </p>
    )}
  </div>
);

BeThereLoader.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
};

export default BeThereLoader;
