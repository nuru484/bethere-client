// src/components/dashboard/skeletons/SummaryCardsSkeleton.jsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SummaryCardsSkeleton = () => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-4 w-28 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 bg-muted rounded mb-2"></div>
            <div className="h-3 w-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCardsSkeleton;
