// src/hooks/usePaginatedListState.js
//
// URL-backed page/pageSize/filter state for the list pages. Keeping this in
// the search params (instead of useState) means refresh, back/forward and
// shared links land on the same page and filters. Defaults are omitted from
// the URL so a pristine list keeps a clean address, and filter updates use
// history REPLACE so debounced typing does not spam the back stack.
import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { normalizeFilterValue } from "@/lib/filter-value";

const DEFAULT_PAGE = 1;

// Module-level so the default has a stable identity: an inline `[]` would be a
// new array every render and make the filters useMemo below recompute (and
// hand out a fresh object) on every single render.
const NO_FILTER_KEYS = Object.freeze([]);

// An invalid or hand-mangled value (page=abc, page=-2) falls back to the
// default instead of leaking NaN into query params.
const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * @param {object} opts
 * @param {string[]} [opts.filterKeys] filter fields the page owns; pass a
 *   module-level constant so the identity is stable across renders
 * @param {number} [opts.defaultPageSize=10]
 */
export const usePaginatedListState = ({
  filterKeys = NO_FILTER_KEYS,
  defaultPageSize = 10,
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // setFilters has to compare against the CURRENT params without listing them
  // as a dependency: the filter components hold onFiltersChange in an effect
  // dependency array, so a new identity on every URL change would re-run them.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = parsePositiveInt(
    searchParams.get("pageSize"),
    defaultPageSize
  );

  // Same shape the pages previously kept in useState: every declared key is
  // present, absent/empty URL values map to undefined so query-param builders
  // drop them.
  const filters = useMemo(() => {
    const result = {};
    for (const key of filterKeys) {
      const value = searchParams.get(key);
      result[key] = value === null || value === "" ? undefined : value;
    }
    return result;
  }, [searchParams, filterKeys]);

  const updateParams = useCallback(
    (mutate, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (newPage) => {
      updateParams((next) => {
        if (newPage <= DEFAULT_PAGE) {
          next.delete("page");
        } else {
          next.set("page", String(newPage));
        }
      });
    },
    [updateParams]
  );

  // Changing the page size re-slices the whole list, so jump back to page 1
  // (mirrors the previous useState handlers).
  const setPageSize = useCallback(
    (newPageSize) => {
      updateParams((next) => {
        if (newPageSize === defaultPageSize) {
          next.delete("pageSize");
        } else {
          next.set("pageSize", String(newPageSize));
        }
        next.delete("page");
      });
    },
    [updateParams, defaultPageSize]
  );

  // Merge-style updater matching the previous handleFiltersChange contract:
  // callers pass only the keys that changed; undefined/empty clears a key.
  // A filter that ACTUALLY changed resets to page 1.
  const setFilters = useCallback(
    (newFilters) => {
      const current = searchParamsRef.current;
      const entries = Object.entries(newFilters);

      // Debounced inputs and mount effects re-emit the value already in the
      // URL. Writing that back would delete `page` and burn a history entry
      // (replace: true), so /dashboard/users?page=3 would snap to page 1 on
      // every open. A no-op emission must stay a no-op.
      const hasRealChange = entries.some(
        ([key, value]) =>
          normalizeFilterValue(value) !== normalizeFilterValue(current.get(key))
      );
      if (!hasRealChange) return;

      updateParams(
        (next) => {
          entries.forEach(([key, value]) => {
            const normalized = normalizeFilterValue(value);
            if (normalized === undefined) {
              next.delete(key);
            } else {
              next.set(key, normalized);
            }
          });
          next.delete("page");
        },
        // Filters arrive from (debounced) typing: replace, don't push.
        { replace: true }
      );
    },
    [updateParams]
  );

  return { page, pageSize, filters, setPage, setPageSize, setFilters };
};
