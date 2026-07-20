// src/pages/dashboard/review/AnomaliesTab.jsx
//
// Reviewable anomaly flags the attendance flow records (failed liveness,
// suspected replay, etc.), each enriched with the attendant and the retained
// evidence frames. Admins can mark one resolved.
import { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import AsyncBoundary from "@/components/ui/AsyncBoundary";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import Pagination from "@/components/ui/Pagination";
import { useAnomalies, useResolveAnomaly } from "@/hooks/useReview";

const FILTERS = [
  { key: "false", label: "Unresolved" },
  { key: "true", label: "Resolved" },
  { key: "all", label: "All" },
];

const SEVERITY_CLASS = {
  HIGH: "bg-destructive/10 text-destructive",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  LOW: "bg-muted text-muted-foreground",
};

const TYPE_LABEL = {
  LIVENESS_FAILED: "Liveness failed",
  REPLAY_SUSPECTED: "Replay suspected",
  IMPOSSIBLE_TRAVEL: "Impossible travel",
  GEO_IP_MISMATCH: "Geo/IP mismatch",
  DUPLICATE_DESCRIPTOR: "Duplicate face",
  RAPID_ATTEMPTS: "Rapid attempts",
};

const attendantLabel = (a) =>
  a.user
    ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim() || a.user.email
    : `User #${a.userId ?? "?"}`;

function AnomalyCard({ anomaly }) {
  const resolve = useResolveAnomaly();
  const reasons = Array.isArray(anomaly.detail?.reasons)
    ? anomaly.detail.reasons.join(", ")
    : null;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight text-secondary-foreground">
            <ShieldAlert className="h-3 w-3" strokeWidth={2} />
            {TYPE_LABEL[anomaly.type] ?? anomaly.type}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight ${
              SEVERITY_CLASS[anomaly.severity] ?? SEVERITY_CLASS.LOW
            }`}
          >
            {anomaly.severity}
          </span>
          {anomaly.resolvedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-tight text-primary">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              Resolved
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {format(new Date(anomaly.createdAt), "d MMM yyyy, HH:mm")}
          </span>
        </div>

        <div className="text-sm">
          <p className="font-medium text-foreground break-words">
            {attendantLabel(anomaly)}
          </p>
          {reasons && (
            <p className="mt-0.5 text-muted-foreground break-words">{reasons}</p>
          )}
          {anomaly.evidence &&
            (anomaly.evidence.matchDistance != null ||
              anomaly.evidence.livenessScore != null) && (
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {anomaly.evidence.matchDistance != null &&
                  `distance ${anomaly.evidence.matchDistance.toFixed(2)}`}
                {anomaly.evidence.livenessScore != null &&
                  `  score ${anomaly.evidence.livenessScore}`}
              </p>
            )}
        </div>

        {anomaly.evidence?.frameUrls?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {anomaly.evidence.frameUrls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={url}
                  alt={`Evidence frame ${i + 1}`}
                  loading="lazy"
                  className="h-16 w-16 rounded-md border border-border object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {!anomaly.resolvedAt && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate(anomaly.id)}
            >
              {resolve.isPending ? "Resolving..." : "Mark resolved"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

AnomalyCard.propTypes = {
  anomaly: PropTypes.object.isRequired,
};

export default function AnomaliesTab() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("false");
  const pageSize = 10;

  const resolved = filter === "all" ? undefined : filter;
  const { data, isLoading, isError, error, refetch } = useAnomalies({
    page,
    limit: pageSize,
    resolved,
  });

  const anomalies = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        skeleton={<DataTableSkeleton />}
        errorClassName={null}
      >
        {anomalies.length === 0 ? (
          <EmptyState
            eyebrow="Review"
            title="No anomalies"
            description={
              filter === "false"
                ? "No unresolved anomalies. Failed or suspicious check-ins would appear here."
                : "Nothing matches this filter."
            }
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {anomalies.map((a) => (
                <AnomalyCard key={a.id} anomaly={a} />
              ))}
            </div>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
