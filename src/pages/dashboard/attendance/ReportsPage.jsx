// src/pages/AttendanceReportsPage.jsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AttendanceFilters } from "@/components/attendance/reports/Filters";
import { AttendanceReportDisplay } from "@/components/attendance/reports/AttendanceReportDisplay";

const AttendanceReportsPage = () => {
  const [filters, setFilters] = React.useState({
    page: 1,
    limit: 10,
  });
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Load filters from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const obj = { page: 1, limit: 10 };

    for (const [k, v] of params.entries()) {
      if (["page", "limit", "userId"].includes(k)) {
        obj[k] = Number(v);
      } else if (k === "isRecurring") {
        obj[k] = v === "true";
      } else {
        obj[k] = v;
      }
    }
    setFilters(obj);
  }, []);

  const updateUrl = (newFilters) => {
    const sp = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        sp.set(k, String(v));
      }
    });
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, "", url);
  };

  const handleFiltersChange = (newF) => {
    const merged = { ...filters, ...newF, page: 1 };
    setFilters(merged);
    updateUrl(merged);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    updateUrl(updated);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    const defaultFilters = { page: 1, limit: 10 };
    setFilters(defaultFilters);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      !["page", "limit"].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  // Plain node (not an inline component) so the filters keep their state
  // and focus across parent re-renders.
  const filtersNode = (
    <AttendanceFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onReset={handleReset}
    />
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        {/* Header: mono eyebrow + display title */}
        <div className="mb-6 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Reports
            </p>
            <h1 className="mt-1 font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Attendance
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Cross-event records, summaries and top attendees
            </p>
          </div>

          {/* Mobile filter button */}
          <div className="flex-shrink-0 xl:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-full sm:w-96 overflow-y-auto p-4 pt-10"
              >
                {filtersNode}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden xl:block xl:w-80 flex-shrink-0">
            <div className="sticky top-6">{filtersNode}</div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <AttendanceReportDisplay
              params={filters}
              onPageChange={handlePageChange}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportsPage;
