// src/components/dashboard/analytics/KpiCard.jsx
//
// One hero KPI tile: a tinted icon chip, a mono label, the big value, an
// optional period-over-period trend, and an optional meta line. Presentational.
import PropTypes from "prop-types";
import { Card } from "@/components/ui/card";
import TrendIndicator from "./TrendIndicator";
import { cn } from "@/lib/utils";

const KpiCard = ({ icon: Icon, label, value, accent, trend, inverse, meta }) => (
  <Card className="flex flex-col justify-between gap-3 p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        {label}
      </p>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", accent)}>
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <div>
      <p className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <div className="mt-2 flex min-h-[1rem] flex-wrap items-center gap-x-2 gap-y-1">
        {trend && <TrendIndicator trend={trend} inverse={inverse} />}
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
      </div>
    </div>
  </Card>
);

KpiCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string,
  trend: PropTypes.object,
  inverse: PropTypes.bool,
  meta: PropTypes.string,
};

export default KpiCard;
