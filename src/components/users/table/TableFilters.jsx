// src/components/users/table/TableFilters.jsx
import { useState, useEffect } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import PropTypes from "prop-types";

export function TableFilters({
  table,
  filters,
  onFiltersChange,
  totalCount,
  onDeleteSelected,
}) {
  const selectedCount = table.getSelectedRowModel().rows.length;

  const [searchInput, setSearchInput] = useState(filters.search || "");

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  const hasFiltersApplied = filters.search !== undefined;

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      search: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Selection Info & Delete Action */}
        <div className="flex items-center gap-3 order-2 lg:order-1">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-lg border">
              <Badge variant="secondary" className="font-medium">
                {selectedCount} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                className="h-8 hover:cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          ) : (
            <div className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
              {totalCount} total
            </div>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search users by name or email..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          {/* Clear Filters */}
          {hasFiltersApplied && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="whitespace-nowrap"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Toggle columns</div>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.replace(/([A-Z])/g, " $1").trim()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFiltersApplied && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-2">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchInput("");
                  onFiltersChange({ search: undefined });
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

TableFilters.propTypes = {
  table: PropTypes.shape({
    getSelectedRowModel: PropTypes.func.isRequired,
    getAllColumns: PropTypes.func.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  totalCount: PropTypes.number.isRequired,
  onDeleteSelected: PropTypes.func.isRequired,
};

TableFilters.defaultProps = {
  filters: {
    search: "",
  },
};
