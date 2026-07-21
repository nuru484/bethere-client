// src/hooks/usePaginatedListState.js
//
// URL-backed page/pageSize/filter state for the list pages. Keeping this in
// the search params (instead of useState) means refresh, back/forward and
// shared links land on the same page and filters. Defaults are omitted from
// the URL so a pristine list keeps a clean address, and filter updates use
// history REPLACE so debounced typing does not spam the back stack.
//
// On top of the URL it mirrors the view into sessionStorage, so re-entering a
// list with a BARE url (e.g. through the sidebar or a "back to list" link)
// restores where you left it - an explicit URL always wins, and a fresh
// browser session (sessionStorage cleared) starts clean. This mirrors the DMS
// use-table-query-state design.
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { normalizeFilterValue } from "@/lib/filter-value";

const DEFAULT_PAGE = 1;
const STORAGE_PREFIX = "bethere:list-state:";

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
 * @param {string} [opts.storageKey] key for the remembered view; defaults to
 *   the current pathname (so each list - and each :id instance - is separate)
 */
export const usePaginatedListState = ({
  filterKeys = NO_FILTER_KEYS,
  defaultPageSize = 10,
  storageKey,
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // The params this list owns, in the URL and in the remembered view.
  const ownedKeys = useMemo(
    () => ["page", "pageSize", ...filterKeys],
    [filterKeys]
  );
  const storageId = `${STORAGE_PREFIX}${storageKey ?? location.pathname}`;

  // Mirrors the latest params AND chains WITHIN a tick: two updates fired from
  // the same handler (the pagination bar changes page size AND page at once)
  // must both land. React Router's functional `setSearchParams(prev => ...)`
  // hands each call the SAME pre-handler `prev`, so the second navigation would
  // otherwise clobber the first (this was the "row count falls back to 10"
  // bug). Building each update from this ref, and passing a concrete value,
  // makes them compose.
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

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
      const next = new URLSearchParams(paramsRef.current);
      mutate(next);
      // Chain: a second update this tick reads this, not the stale render value.
      paramsRef.current = next;
      setSearchParams(next, { replace });
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
      const current = paramsRef.current;
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

  // --- remembered view (sessionStorage) ------------------------------------
  // Skip the storage write on the render where we restored, so restoring a
  // bare URL does not momentarily clear the very state we just read back.
  const restoringRef = useRef(false);
  const restoreCheckedRef = useRef(false);

  // Restore ONCE on mount, only when the URL carries none of the owned params.
  useEffect(() => {
    if (restoreCheckedRef.current) return;
    restoreCheckedRef.current = true;
    if (ownedKeys.some((key) => searchParams.has(key))) return; // explicit URL wins
    try {
      const saved = sessionStorage.getItem(storageId);
      if (!saved) return;
      const restored = new URLSearchParams(saved);
      if ([...restored.keys()].length > 0) {
        restoringRef.current = true;
        setSearchParams(restored, { replace: true });
      }
    } catch {
      /* sessionStorage unavailable - degrade to URL-only */
    }
    // Mount-only: capture the initial URL/storage and restore at most once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the current owned params so a later bare re-entry can restore them.
  useEffect(() => {
    if (restoringRef.current) {
      restoringRef.current = false;
      return; // the restore navigation, not a real change
    }
    const relevant = new URLSearchParams();
    for (const key of ownedKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") relevant.set(key, value);
    }
    try {
      const serialized = relevant.toString();
      if (serialized) sessionStorage.setItem(storageId, serialized);
      else sessionStorage.removeItem(storageId);
    } catch {
      /* sessionStorage unavailable - degrade to URL-only */
    }
  }, [searchParams, ownedKeys, storageId]);

  return { page, pageSize, filters, setPage, setPageSize, setFilters };
};
