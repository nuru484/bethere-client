// src/components/dashboard/skeletons/PieChartSkeleton.jsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PieChartSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-52 bg-muted rounded"></div>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* Circle outline */}
          <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
          {/* Pie slices simulation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-muted/50"></div>
          </div>
        </div>
      </CardContent>
      {/* Legend skeleton */}
      <div className="px-6 pb-6 flex justify-center gap-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-3 w-3 bg-muted rounded-full"></div>
            <div className="h-3 w-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PieChartSkeleton;
