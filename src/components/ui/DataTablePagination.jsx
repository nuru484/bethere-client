// src/components/ui/DataTablePagination.jsx
//
// Minimal table pagination: mono micro-label on the left ("Page X of Y",
// total or selection count), then the shared rows-per-page select and
// Prev/Next chips (PaginationControls). Contract unchanged.
import PropTypes from "prop-types";
import { PaginationControls } from "@/components/ui/PaginationControls";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50, 100];

export function DataTablePagination({
  table,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const selectedCount = table.getSelectedRowModel().rows.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Show the bar whenever pagination is meaningful at ANY selectable page size
  // - i.e. the total exceeds the SMALLEST option - so the rows-per-page select
  // stays available even when the current size fits everything on one page (a
  // user who bumped it to 100 can drop back to 10). Below the smallest size
  // there is nothing to paginate: render only the selection count, if any.
  if (totalCount <= PAGE_SIZE_OPTIONS[0]) {
    if (selectedCount === 0) return null;

    return (
      <div className="border-t border-border pt-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          {selectedCount} of {totalCount} selected
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        Page {page} of {totalPages}
        <span className="text-muted-foreground/70">
          {" "}
          ·{" "}
          {selectedCount > 0
            ? `${selectedCount} of ${totalCount} selected`
            : `${totalCount.toLocaleString()} total`}
        </span>
      </p>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        selectId="page-size"
        selectSide="top"
      />
    </div>
  );
}

DataTablePagination.propTypes = {
  table: PropTypes.shape({
    getSelectedRowModel: PropTypes.func.isRequired,
  }).isRequired,
  totalCount: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
};
