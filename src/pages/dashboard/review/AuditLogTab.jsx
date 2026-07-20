// src/pages/dashboard/review/AuditLogTab.jsx
//
// The append-only audit trail: check-ins/outs, liveness failures, face
// enroll/reset, and admin actions. Read-only. Responsive - a table from md up,
// stacked rows below.
import { useState } from "react";
import { format } from "date-fns";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import Pagination from "@/components/ui/Pagination";
import { useAuditLogs } from "@/hooks/useReview";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const humanize = (action) =>
  (action ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const actor = (log) =>
  log.actorId ? `${log.actorKind} #${log.actorId}` : log.actorKind;

const target = (log) =>
  log.targetType ? `${log.targetType} #${log.targetId ?? "?"}` : "-";

const when = (log) => format(new Date(log.createdAt), "d MMM yyyy, HH:mm");

export default function AuditLogTab() {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    limit: pageSize,
  });

  const logs = data?.data ?? [];

  if (isLoading) return <DataTableSkeleton />;
  if (isError) {
    return (
      <ErrorMessage
        error={extractApiErrorMessage(error).message}
        onRetry={refetch}
      />
    );
  }
  if (logs.length === 0) {
    return (
      <EmptyState
        eyebrow="Review"
        title="No audit entries"
        description="Check-ins, enrollments and admin actions will be recorded here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Below md: stacked rows. */}
      <ul className="space-y-2 md:hidden">
        {logs.map((log) => (
          <li
            key={log.id}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {humanize(log.action)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {when(log)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {actor(log)} · {target(log)}
              {log.ip ? ` · ${log.ip}` : ""}
            </p>
          </li>
        ))}
      </ul>

      {/* md and up: table. */}
      <div className="hidden overflow-x-auto rounded-md border border-border md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                When
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                Action
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                Actor
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                Target
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                  {when(log)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-medium text-foreground">
                  {humanize(log.action)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                  {actor(log)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                  {target(log)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                  {log.ip ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={data.meta} onPageChange={setPage} />
    </div>
  );
}
