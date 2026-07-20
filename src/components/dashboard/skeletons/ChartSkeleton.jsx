// src/components/dashboard/skeletons/ChartSkeleton.jsx
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ChartSkeleton = ({ height = "h-80", title = true }) => {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        {title && <div className="h-6 w-48 bg-muted rounded"></div>}
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6">
        <div
          className={`${height} w-full bg-muted/50 rounded-lg flex items-end justify-around px-4 pb-4`}
        >
          {/* Simulated bar chart pattern */}
          <div
            className="w-1/6 bg-muted rounded-t"
            style={{ height: "60%" }}
          ></div>
          <div
            className="w-1/6 bg-muted rounded-t"
            style={{ height: "80%" }}
          ></div>
          <div
            className="w-1/6 bg-muted rounded-t"
            style={{ height: "40%" }}
          ></div>
          <div
            className="w-1/6 bg-muted rounded-t"
            style={{ height: "70%" }}
          ></div>
          <div
            className="w-1/6 bg-muted rounded-t"
            style={{ height: "55%" }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};

ChartSkeleton.propTypes = {
  height: PropTypes.string,
  title: PropTypes.bool,
};

export default ChartSkeleton;
