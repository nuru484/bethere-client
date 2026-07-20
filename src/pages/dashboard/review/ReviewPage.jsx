// src/pages/dashboard/review/ReviewPage.jsx
//
// Admin security review: anomaly flags (with evidence) and the append-only
// audit log - the read surface for the detective controls the attendance flow
// records.
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import AnomaliesTab from "./AnomaliesTab";
import AuditLogTab from "./AuditLogTab";

export default function ReviewPage() {
  usePageTitle("Security review - BeThere");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-4 py-4 sm:space-y-6 sm:py-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Security
            </p>
            <h1 className="mt-1 font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Review
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Flagged check-in attempts and the full audit trail
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            Back
          </Button>
        </div>

        <Tabs defaultValue="anomalies">
          <TabsList>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>
          <TabsContent value="anomalies" className="mt-4">
            <AnomaliesTab />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
