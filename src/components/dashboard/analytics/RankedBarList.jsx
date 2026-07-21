// src/components/dashboard/analytics/RankedBarList.jsx
//
// A ranked horizontal-bar breakdown: one row per item with a label, a value,
// an optional sub-metric, and a track/fill bar scaled to the largest value.
// Used for per-event and per-venue turnout where a donut would be too busy.
import PropTypes from "prop-types";
import { CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import { fmtInt } from "./analytics-format";

const RankedBarList = ({ items, colorFor, sub }) => {
  const max = items.reduce((peak, item) => Math.max(peak, item.count || 0), 0) || 1;

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const color = colorFor
          ? colorFor(item.key, index)
          : CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
        const width = `${Math.max(2, ((item.count || 0) / max) * 100)}%`;
        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{item.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-mono font-semibold text-foreground">{fmtInt(item.count)}</span>
                {sub && <span className="text-xs text-muted-foreground">{sub(item)}</span>}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

RankedBarList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    })
  ).isRequired,
  colorFor: PropTypes.func,
  sub: PropTypes.func,
};

export default RankedBarList;
