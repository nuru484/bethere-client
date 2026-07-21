// src/pages/dashboard/attendance/ReportsPage.jsx
//
// The reports surface, reworked: a DMS-style toolbar (a Filters toggle + Excel
// / PDF / Print exports) over a collapsible compact filter panel, above the
// filtered report. The report region is wrapped in `report-print-area` so the
// print stylesheet and the PDF capture can isolate it from the app chrome.
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { SlidersHorizontal, Download, FileText, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReportFilters from "@/components/attendance/reports/ReportFilters";
import { AttendanceReportDisplay } from "@/components/attendance/reports/AttendanceReportDisplay";
import { downloadReportXlsx, exportReportPdf, printReport } from "@/lib/report-export";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";

const DEFAULTS = { page: 1, limit: 10 };

const AttendanceReportsPage = () => {
  const [filters, setFilters] = useState(DEFAULTS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [busy, setBusy] = useState(null); // "xlsx" | "pdf" | null
  const reportRef = useRef(null);

  const activeCount = Object.entries(filters).filter(
    ([key, value]) =>
      !["page", "limit"].includes(key) && value !== undefined && value !== null && value !== ""
  ).length;

  const handleChange = (partial) => setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  const handlePage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleClear = () => setFilters(DEFAULTS);

  const doXlsx = async () => {
    setBusy("xlsx");
    const toastId = toast.loading("Preparing Excel...");
    try {
      await downloadReportXlsx(filters);
      toast.success("Excel downloaded", { id: toastId });
    } catch (error) {
      toast.error(extractApiErrorMessage(error).message || "Export failed", { id: toastId });
    } finally {
      setBusy(null);
    }
  };

  const doPdf = async () => {
    setBusy("pdf");
    const toastId = toast.loading("Rendering PDF...");
    try {
      await exportReportPdf(reportRef.current);
      toast.success("PDF downloaded", { id: toastId });
    } catch {
      toast.error("Could not generate the PDF", { id: toastId });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* header + toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Reports
            </p>
            <h1 className="mt-1 font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Attendance
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Cross-event records, summaries, and exports
            </p>
          </div>

          <div className="report-no-print flex flex-wrap items-center gap-2">
            <Button
              variant={filtersOpen || activeCount > 0 ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-background/20 px-1 text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={doXlsx} disabled={busy === "xlsx"}>
              {busy === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={doPdf} disabled={busy === "pdf"}>
              {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={printReport}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>

        {/* collapsible filter panel */}
        {filtersOpen && (
          <Card className="report-no-print p-4">
            <ReportFilters filters={filters} onChange={handleChange} onClear={handleClear} />
          </Card>
        )}

        {/* the report itself (exportable / printable region) */}
        <div ref={reportRef} className="report-print-area">
          <AttendanceReportDisplay params={filters} onPageChange={handlePage} />
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportsPage;
