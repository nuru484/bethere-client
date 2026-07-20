// src/lib/filter-value.js
//
// "No filter" has three spellings depending on where the value came from:
// absent from the URL (null out of URLSearchParams.get), cleared by a control
// (undefined/null), or an emptied text input (""). Filter bars compare their
// local input state against the URL-derived filters to decide whether to emit
// a change, so both sides have to be collapsed to the same empty value first -
// otherwise `"" !== undefined` fires a bogus "change" on mount and the list
// state hook throws away the page the user is actually on.
export const normalizeFilterValue = (value) =>
  value === undefined || value === null || value === "" ? undefined : String(value);
