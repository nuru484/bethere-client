// src/components/ui/Pagination.jsx
//
// Minimal list pagination: mono micro-label on the left ("Page X of Y",
// entry range), an optional compact rows-per-page select, and plain
// Prev/Next chips on the right. Contract unchanged: meta {total, page,
// limit, totalPages}, onPageChange, optional onLimitChange.
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Pagination = ({
  meta,
  onPageChange,
  onLimitChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) => {
  const { total, page: currentPage, limit, totalPages } = meta;

  // Nothing to paginate: a single page needs no controls at all.
  if (totalPages <= 1) return null;

  // Calculate current range
  const startItem = Math.min((currentPage - 1) * limit + 1, total);
  const endItem = Math.min(currentPage * limit, total);

  const handlePageSizeChange = (newLimit) => {
    if (onLimitChange) {
      const currentFirstItem = (currentPage - 1) * limit + 1;
      const newPage = Math.ceil(currentFirstItem / newLimit);
      onLimitChange(newLimit);
      onPageChange(Math.max(1, newPage));
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 ${className}`}
    >
      {/* The toolbar above the table owns the total count; this label only
          places the reader within the pages. */}
      <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
        Page {currentPage} of {Math.max(totalPages, 1)}
        <span className="text-muted-foreground/70">
          {" "}
          · {startItem.toLocaleString()}-{endItem.toLocaleString()}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector && onLimitChange && (
          <div className="mr-2 flex items-center gap-2">
            <label
              htmlFor="pageSize"
              className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
            >
              Rows
            </label>
            <Select
              value={limit.toString()}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger
                id="pageSize"
                className="h-8 w-[72px] cursor-pointer bg-white"
              >
                <SelectValue placeholder={limit} />
              </SelectTrigger>
              <SelectContent className="min-w-[72px]">
                {pageSizeOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option.toString()}
                    className="cursor-pointer"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  meta: PropTypes.shape({
    total: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func,
  showPageSizeSelector: PropTypes.bool,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  className: PropTypes.string,
};

export default Pagination;
