// src/components/dashboard/user/UserStatusPieChart.jsx
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

const UserStatusPieChart = ({ statusBreakdown }) => {
  const data = [
    {
      name: "Present",
      value: statusBreakdown?.present || 0,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Late",
      value: statusBreakdown?.late || 0,
      color: "hsl(var(--chart-4))",
    },
    {
      name: "Absent",
      value: statusBreakdown?.absent || 0,
      color: "hsl(var(--chart-3))",
    },
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Attendance Status</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(2);
      return (
        <div className="bg-popover p-3 border border-border rounded-lg shadow-sm">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Count: {payload[0].value}
          </p>
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
      })
    ),
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
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
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  renderCustomLabel.propTypes = {
    cx: PropTypes.number,
    cy: PropTypes.number,
    midAngle: PropTypes.number,
    innerRadius: PropTypes.number,
    outerRadius: PropTypes.number,
    percent: PropTypes.number,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Attendance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="hsl(var(--chart-1))"
              dataKey="value"
            >
              {data.map((entry, index) => (
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

UserStatusPieChart.propTypes = {
  statusBreakdown: PropTypes.shape({
    present: PropTypes.number,
    late: PropTypes.number,
    absent: PropTypes.number,
  }),
};

export default UserStatusPieChart;
