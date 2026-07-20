// src/components/dashboard/charts/StatusPieChart.jsx
//
// Shared donut/pie chart. The attendance-status breakdown (admin + user) and
// the user's event-type distribution are all the same shape - a filtered
// set of coloured slices with a percentage tooltip and in-slice labels - so
// they share this one component. Callers pass a pre-coloured `data` array and
// the card copy; the component filters out empty slices and renders the rest.
import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";

// Hoisted to module scope so recharts is not handed a brand-new element on
// every parent render (which would remount the tooltip). The per-slice total
// travels on each datum's payload so this stays a pure, closure-free function.
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const total = entry.payload?.total ?? 0;
    const percentage = total ? ((entry.value / total) * 100).toFixed(2) : "0.00";
    return (
      <div className="bg-popover p-3 border border-border rounded-lg shadow-sm">
        <p className="font-semibold text-foreground">{entry.name}</p>
        <p className="text-sm text-muted-foreground">Count: {entry.value}</p>
        <p className="text-sm text-muted-foreground">
          Percentage: {percentage}%
        </p>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
      payload: PropTypes.shape({ total: PropTypes.number }),
    })
  ),
};

// Label renderer factory: hoisted logic, but the caller's className is baked in
// via a memoised instance so identity stays stable across renders.
const makeRenderLabel = (labelClassName) => {
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className={labelClassName}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  return renderLabel;
};

const StatusPieChart = ({
  data,
  title,
  emptyTitle,
  emptyMessage = "No attendance data available",
  labelClassName = "font-semibold text-sm",
}) => {
  // Drop empty slices and stamp the running total onto each datum so the
  // hoisted tooltip can show a percentage without closing over this array.
  const chartData = useMemo(() => {
    const filtered = (data ?? []).filter((item) => item.value > 0);
    const total = filtered.reduce((sum, item) => sum + item.value, 0);
    return filtered.map((item) => ({ ...item, total }));
  }, [data]);

  const renderLabel = useMemo(
    () => makeRenderLabel(labelClassName),
    [labelClassName]
  );

  if (chartData.length === 0) {
    // Shared empty-state card instead of a bespoke "no data" card.
    return <EmptyState title={emptyTitle} description={emptyMessage} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={120}
              fill="hsl(var(--chart-1))"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

StatusPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number,
      color: PropTypes.string.isRequired,
    })
  ),
  title: PropTypes.string.isRequired,
  emptyTitle: PropTypes.string.isRequired,
  emptyMessage: PropTypes.string,
  labelClassName: PropTypes.string,
};

export default StatusPieChart;
