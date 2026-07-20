// src/components/ui/DataTablePagination.jsx
//
// Minimal table pagination: mono micro-label on the left ("Page X of Y",
// total or selection count), a compact rows-per-page select and plain
// Prev/Next chips on the right. Contract unchanged.
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 flex items-center gap-2">
          <label
            htmlFor="page-size"
            className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
          >
            Rows
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger
              id="page-size"
              className="h-8 w-[72px] cursor-pointer bg-white"
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="min-w-[72px]">
              {[5, 10, 20, 30, 50, 100].map((size) => (
                <SelectItem
                  key={size}
                  value={size.toString()}
                  className="cursor-pointer"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
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
