// src/hooks/usePaginatedListState.test.jsx
//
// URL round-trip for the list-page state hook: page/pageSize/filters are
// read from the search params, written back with defaults omitted, and an
// invalid page in the URL falls back to 1.
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import PropTypes from "prop-types";
import { MemoryRouter, useLocation } from "react-router-dom";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";

const FILTER_KEYS = ["search", "status"];

// Expose the current search string alongside the hook so tests can assert
// on what actually landed in the URL.
const useHarness = () => ({
  list: usePaginatedListState({ filterKeys: FILTER_KEYS }),
  location: useLocation(),
});

const renderListState = (initialEntry = "/dashboard/users") => {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  );
  wrapper.propTypes = { children: PropTypes.node };

  return renderHook(useHarness, { wrapper });
};

describe("usePaginatedListState", () => {
  // The hook now mirrors the view into sessionStorage; clear it between cases
  // so one test's remembered view cannot leak into the next.
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("reads page, pageSize and filters from the URL", () => {
    const { result } = renderListState(
      "/dashboard/users?page=3&pageSize=25&search=jane&status=PRESENT"
    );

    expect(result.current.list.page).toBe(3);
    expect(result.current.list.pageSize).toBe(25);
    expect(result.current.list.filters).toEqual({
      search: "jane",
      status: "PRESENT",
    });
  });

  it("uses defaults when the URL is clean", () => {
    const { result } = renderListState();

    expect(result.current.list.page).toBe(1);
    expect(result.current.list.pageSize).toBe(10);
    expect(result.current.list.filters).toEqual({
      search: undefined,
      status: undefined,
    });
  });

  it("round-trips state through the URL and omits defaults", () => {
    const { result } = renderListState();

    act(() => result.current.list.setFilters({ search: "kofi" }));
    act(() => result.current.list.setPage(2));

    expect(result.current.location.search).toBe("?search=kofi&page=2");
    expect(result.current.list.page).toBe(2);
    expect(result.current.list.filters.search).toBe("kofi");

    // Back to page 1: the default drops out of the URL entirely.
    act(() => result.current.list.setPage(1));
    expect(result.current.location.search).toBe("?search=kofi");

    // Clearing the filter empties the URL again.
    act(() => result.current.list.setFilters({ search: undefined }));
    expect(result.current.location.search).toBe("");
  });

  it("resets to page 1 when filters or page size change", () => {
    const { result } = renderListState("/dashboard/users?page=4");

    act(() => result.current.list.setFilters({ status: "ABSENT" }));
    expect(result.current.list.page).toBe(1);

    act(() => result.current.list.setPage(3));
    act(() => result.current.list.setPageSize(50));
    expect(result.current.list.page).toBe(1);
    expect(result.current.list.pageSize).toBe(50);
    // The filter survives a page-size change; only the page resets.
    expect(result.current.location.search).toBe("?status=ABSENT&pageSize=50");
  });

  it("keeps the page when a filter is re-emitted with the value already in the URL", () => {
    const { result } = renderListState("/dashboard/users?page=3");

    // What a filter bar emits on mount: an empty search box against a URL
    // that has no search param at all.
    act(() => result.current.list.setFilters({ search: undefined }));
    expect(result.current.list.page).toBe(3);
    expect(result.current.location.search).toBe("?page=3");

    // Same for the "" spelling of empty, and for echoing back a value that
    // is already there.
    act(() => result.current.list.setFilters({ search: "" }));
    expect(result.current.list.page).toBe(3);

    act(() => result.current.list.setFilters({ search: "jane" }));
    act(() => result.current.list.setPage(3));
    act(() => result.current.list.setFilters({ search: "jane" }));
    expect(result.current.list.page).toBe(3);
    expect(result.current.list.filters.search).toBe("jane");
  });

  it("falls back to page 1 for an invalid page in the URL", () => {
    for (const bad of ["abc", "-2", "0", "1.5"]) {
      const { result } = renderListState(`/dashboard/users?page=${bad}`);
      expect(result.current.list.page).toBe(1);
    }
  });

  it("applies a page-size and page change fired together in one tick", () => {
    // Exactly what the pagination bar does when the rows-per-page select
    // changes: set the size AND jump to a page in the same handler. The two
    // updates must compose - the earlier "row count falls back to 10" bug was
    // the second navigation clobbering the first.
    const { result } = renderListState("/dashboard/users?page=5");

    act(() => {
      result.current.list.setPageSize(25);
      result.current.list.setPage(2);
    });

    expect(result.current.list.pageSize).toBe(25);
    expect(result.current.list.page).toBe(2);
    expect(result.current.location.search).toContain("pageSize=25");
    expect(result.current.location.search).toContain("page=2");
  });

  it("remembers the view and restores it when re-entered with a bare URL", () => {
    // First visit at an explicit state - it is saved to sessionStorage.
    const first = renderListState(
      "/dashboard/users?page=3&pageSize=25&search=jane"
    );
    expect(first.result.current.list.page).toBe(3);
    first.unmount();

    // Re-enter the SAME list with a clean URL (e.g. via the sidebar): the
    // remembered page/size/filters come back.
    const second = renderListState("/dashboard/users");
    expect(second.result.current.list.page).toBe(3);
    expect(second.result.current.list.pageSize).toBe(25);
    expect(second.result.current.list.filters.search).toBe("jane");
  });

  it("lets an explicit URL win over the remembered view", () => {
    renderListState("/dashboard/users?page=4").unmount();

    // Arriving with its own params ignores whatever was remembered.
    const { result } = renderListState("/dashboard/users?page=2");
    expect(result.current.list.page).toBe(2);
  });
});
