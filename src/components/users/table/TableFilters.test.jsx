// src/components/users/table/TableFilters.test.jsx
//
// The filter bar wired to the real URL-state hook, which is where the
// interesting bug lived: an empty search box ("") compared against an absent
// URL filter (undefined) used to look like a change, so simply OPENING
// /dashboard/users?page=3 emitted a filter update and snapped back to page 1.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import PropTypes from "prop-types";
import { MemoryRouter } from "react-router-dom";
import { TableFilters } from "@/components/users/table/TableFilters";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";

const FILTER_KEYS = ["search"];

// The bar only calls these two off `table`, and never with a real row model.
const table = {
  getSelectedRowModel: () => ({ rows: [] }),
  getAllColumns: () => [],
};

const Harness = () => {
  const { page, filters, setFilters } = usePaginatedListState({
    filterKeys: FILTER_KEYS,
  });

  return (
    <>
      <span data-testid="page">{page}</span>
      <TableFilters
        table={table}
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={0}
        onDeleteSelected={() => {}}
      />
    </>
  );
};

const renderAt = (entry) => {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  );
  wrapper.propTypes = { children: PropTypes.node };

  return render(<Harness />, { wrapper });
};

// The search box is debounced by 500ms; let it settle.
const settleDebounce = () =>
  act(() => {
    vi.advanceTimersByTime(600);
  });

describe("TableFilters + usePaginatedListState", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays on the page from the URL when mounted with no search filter", () => {
    renderAt("/dashboard/users?page=3");

    expect(screen.getByTestId("page")).toHaveTextContent("3");

    settleDebounce();

    expect(screen.getByTestId("page")).toHaveTextContent("3");
  });

  it("stays on the page from the URL when mounted with a search filter", () => {
    renderAt("/dashboard/users?page=3&search=jane");

    settleDebounce();

    expect(screen.getByTestId("page")).toHaveTextContent("3");
    expect(screen.getByRole("textbox")).toHaveValue("jane");
  });

  it("resets to page 1 on a real search change", () => {
    renderAt("/dashboard/users?page=3");

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "kofi" },
    });
    settleDebounce();

    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });
});
