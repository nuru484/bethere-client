// src/components/dashboard/AttendanceBarChart.jsx
import PropTypes from "prop-types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLOR } from "@/lib/chart-colors";

const AttendanceBarChart = ({ statusCounts, statusPercentages }) => {
  const data = [
    {
      name: "Present",
      count: statusCounts?.present || 0,
      percentage: parseFloat(statusPercentages?.present || 0),
      fill: STATUS_COLOR.present,
    },
    {
      name: "Late",
      count: statusCounts?.late || 0,
      percentage: parseFloat(statusPercentages?.late || 0),
      fill: STATUS_COLOR.late,
    },
    {
      name: "Absent",
      count: statusCounts?.absent || 0,
      percentage: parseFloat(statusPercentages?.absent || 0),
      fill: STATUS_COLOR.absent,
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 border border-border rounded-lg shadow-sm">
          <p className="font-semibold text-foreground">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Count: {payload[0].payload.count}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {payload[0].payload.percentage.toFixed(2)}%
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
        payload: PropTypes.shape({
          name: PropTypes.string,
          count: PropTypes.number,
          percentage: PropTypes.number,
        }),
      })
    ),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              label={{
                value: "Count",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" name="Attendance Count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

AttendanceBarChart.propTypes = {
  statusCounts: PropTypes.shape({
    present: PropTypes.number,
    late: PropTypes.number,
    absent: PropTypes.number,
  }),
  statusPercentages: PropTypes.shape({
    present: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    late: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    absent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default AttendanceBarChart;
