// src/components/dashboard/analytics/ChartTooltip.jsx
//
// A shared frosted-glass Recharts tooltip: a translucent, blurred panel with a
// colour dot per series. Pass it via `content={<ChartTooltip .../>}`; Recharts
// injects `active`/`payload`/`label` and merges the extra props below.
import PropTypes from "prop-types";

const ChartTooltip = ({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  hideZero = false,
}) => {
  if (!active || !payload?.length) return null;

  const rows = payload
    .filter((entry) => entry.value !== null && entry.value !== undefined)
    .filter((entry) => (hideZero ? entry.value !== 0 : true));

  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg bg-card/95 px-3 py-2 text-xs shadow-lg ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
      {label !== undefined && (
        <p className="mb-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {rows.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-foreground">
              {valueFormatter ? valueFormatter(entry.value, entry) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

ChartTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  labelFormatter: PropTypes.func,
  valueFormatter: PropTypes.func,
  hideZero: PropTypes.bool,
};

export default ChartTooltip;
