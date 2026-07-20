// src/components/dashboard/charts/AttendanceLineChart.jsx
//
// Shared attendance-over-time line chart used by both the admin and user
// dashboards. The two dashboards differ only in the card titles and the label
// of the dashed "total" series, so those are props; everything else is shared.
import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { STATUS_COLOR } from "@/lib/chart-colors";

const AttendanceLineChart = ({
  data,
  title,
  emptyTitle,
  totalLabel = "Total",
}) => {
  // Derived series is memoised so the array identity is stable across renders
  // (recharts otherwise re-runs its animation/layout on every parent render).
  const formattedData = useMemo(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        formattedDate: format(new Date(item.date), "MMM dd"),
      })),
    [data]
  );

  if (!data || data.length === 0) {
    // Shared empty-state card instead of a bespoke "no data" card.
    return (
      <EmptyState title={emptyTitle} description="No attendance data available" />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                boxShadow: "none",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="present"
              stroke={STATUS_COLOR.present}
              strokeWidth={2}
              name="Present"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="late"
              stroke={STATUS_COLOR.late}
              strokeWidth={2}
              name="Late"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke={STATUS_COLOR.absent}
              strokeWidth={2}
              name="Absent"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={STATUS_COLOR.total}
              strokeWidth={2}
              name={totalLabel}
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

AttendanceLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
        .isRequired,
      present: PropTypes.number,
      late: PropTypes.number,
      absent: PropTypes.number,
      total: PropTypes.number,
    })
  ),
  title: PropTypes.string.isRequired,
  emptyTitle: PropTypes.string.isRequired,
  totalLabel: PropTypes.string,
};

export default AttendanceLineChart;
