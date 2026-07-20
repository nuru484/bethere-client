// src/components/ui/PaginationControls.jsx
//
// The shared right-hand side of both pagination bars (DataTablePagination
// and Pagination): compact rows-per-page select + Prev/Next chips. Extracted
// because the two bars had drifted into ~80% duplicates - including the same
// dark-mode bug (hardcoded bg-white select trigger).
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PaginationControls({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  selectId = "page-size",
  selectSide,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onPageSizeChange && (
        <div className="mr-2 flex items-center gap-2">
          <label
            htmlFor={selectId}
            className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
          >
            Rows
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              id={selectId}
              className="h-8 w-[72px] cursor-pointer bg-background"
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side={selectSide} className="min-w-[72px]">
              {pageSizeOptions.map((size) => (
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
      )}

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
  );
}

PaginationControls.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  selectId: PropTypes.string,
  selectSide: PropTypes.string,
};
