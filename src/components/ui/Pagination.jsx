// src/components/ui/Pagination.jsx
//
// Minimal list pagination: mono micro-label on the left ("Page X of Y",
// entry range), then the shared rows-per-page select and Prev/Next chips
// (PaginationControls). Contract unchanged: meta {total, page, limit,
// totalPages}, onPageChange, optional onLimitChange.
import PropTypes from "prop-types";
import { PaginationControls } from "@/components/ui/PaginationControls";

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

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        pageSize={limit}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={
          showPageSizeSelector && onLimitChange ? handlePageSizeChange : undefined
        }
        selectId="pageSize"
      />
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
