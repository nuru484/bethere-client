// src/components/dashboard/skeletons/DashboardTotalsCardSkeleton.jsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DashboardTotalsCardSkeleton = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-3 w-24 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardTotalsCardSkeleton;
