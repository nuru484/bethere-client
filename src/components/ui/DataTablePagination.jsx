// src/components/ui/DataTablePagination.jsx
//
// Minimal table pagination: mono micro-label on the left ("Page X of Y",
// total or selection count), then the shared rows-per-page select and
// Prev/Next chips (PaginationControls). Contract unchanged.
import PropTypes from "prop-types";
import { PaginationControls } from "@/components/ui/PaginationControls";

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

  // Nothing to paginate: on a single page render only the selection count
  // (when rows are selected), otherwise nothing at all.
  if (totalPages <= 1) {
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
        pageSizeOptions={[5, 10, 20, 30, 50, 100]}
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
