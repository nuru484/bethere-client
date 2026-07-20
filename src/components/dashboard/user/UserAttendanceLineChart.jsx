// src/components/dashboard/user/UserAttendanceLineChart.jsx
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
import { format } from "date-fns";

const UserAttendanceLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Attendance Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No attendance data available</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM dd"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Attendance Trends</CardTitle>
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
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Present"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="late"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              name="Late"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Absent"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              name="Total Events"
              dot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

UserAttendanceLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      total: PropTypes.number,
      present: PropTypes.number,
      late: PropTypes.number,
      absent: PropTypes.number,
    })
  ),
};

export default UserAttendanceLineChart;
