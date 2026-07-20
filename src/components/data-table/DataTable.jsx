// src/components/data-table/DataTable.jsx
//
// Shared server-paginated data table. Owns the tanstack table setup,
// header/body rendering, the loading skeleton rows and the pagination
// wiring so per-entity tables only supply columns, filters and row
// actions.
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/DataTablePagination";
import PropTypes from "prop-types";

export function DataTable({
  columns,
  data,
  loading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  renderFilters,
  renderSkeletonCells,
  emptyMessage = "No matches for the current filters - clear the filters to see all records.",
  emptyState,
  hasActiveFilters = false,
  showPagination = true,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  getRowId,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [internalRowSelection, setInternalRowSelection] = useState({});

  // Row selection is uncontrolled by default; tables that act on the
  // selection (e.g. bulk delete) pass it in as controlled state.
  const isSelectionControlled = controlledRowSelection !== undefined;
  const rowSelection = isSelectionControlled
    ? controlledRowSelection
    : internalRowSelection;

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: isSelectionControlled
      ? onRowSelectionChange
      : setInternalRowSelection,
    // Undefined falls back to tanstack's row-index keys.
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  // Truly empty (no records at all, nothing filtered out): show only the
  // designed empty state - no filter bar, no table shell, no pagination.
  const noRecordsAtAll = !loading && totalCount === 0 && !hasActiveFilters;
  if (noRecordsAtAll && emptyState) {
    return emptyState;
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {renderFilters && renderFilters(table)}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-border hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="border-border">
                    {renderSkeletonCells(index)}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-border hover:bg-secondary/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {/* Filtered to zero: keep the filter bar above so it can
                        be cleared; show a light no-matches note here. */}
                    <p className="text-sm text-muted-foreground">
                      {emptyMessage}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <DataTablePagination
          table={table}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  totalCount: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  renderFilters: PropTypes.func,
  renderSkeletonCells: PropTypes.func.isRequired,
  emptyMessage: PropTypes.node,
  emptyState: PropTypes.node,
  hasActiveFilters: PropTypes.bool,
  showPagination: PropTypes.bool,
  rowSelection: PropTypes.object,
  onRowSelectionChange: PropTypes.func,
  getRowId: PropTypes.func,
};
