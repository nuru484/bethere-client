// src/components/ui/Pagination.test.jsx
//
// Visibility rule shared by both pagination bars: show whenever the total
// exceeds the SMALLEST selectable page size (so the rows-per-page control
// survives bumping the size up), hide only when the list can never span more
// than one page at any size.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Pagination from "@/components/ui/Pagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

const noop = () => {};
const table = (selected = 0) => ({
  getSelectedRowModel: () => ({ rows: Array.from({ length: selected }) }),
});

describe("Pagination visibility", () => {
  it("hides when the total is within the smallest page size", () => {
    const { container } = render(
      <Pagination
        meta={{ total: 4, page: 1, limit: 10, totalPages: 1 }}
        onPageChange={noop}
        onLimitChange={noop}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("keeps the rows-per-page control when a larger size fits a multi-page list on one page", () => {
    render(
      <Pagination
        meta={{ total: 50, page: 1, limit: 100, totalPages: 1 }}
        onPageChange={noop}
        onLimitChange={noop}
        pageSizeOptions={[5, 10, 25, 50, 100]}
      />
    );
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
  });

  it("enables Next for a genuinely multi-page list", () => {
    render(
      <Pagination
        meta={{ total: 30, page: 2, limit: 10, totalPages: 3 }}
        onPageChange={noop}
        onLimitChange={noop}
        pageSizeOptions={[5, 10, 25, 50]}
      />
    );
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });
});

describe("DataTablePagination visibility", () => {
  it("hides when the list is within the smallest page size", () => {
    const { container } = render(
      <DataTablePagination
        table={table()}
        totalCount={3}
        page={1}
        pageSize={10}
        onPageChange={noop}
        onPageSizeChange={noop}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("keeps the bar when the page size fits a larger list on one page", () => {
    render(
      <DataTablePagination
        table={table()}
        totalCount={50}
        page={1}
        pageSize={100}
        onPageChange={noop}
        onPageSizeChange={noop}
      />
    );
    expect(screen.getByText("Rows")).toBeInTheDocument();
  });
});
