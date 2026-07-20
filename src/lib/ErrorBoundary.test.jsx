// src/lib/ErrorBoundary.test.jsx
//
// Layout keys the route-level boundary on location.pathname but resets it via
// resetKey={location.key}. Page and filters live in the query string now, so
// same-pathname navigations (including the boundary's own history.back()
// recovery) have to clear a shown error.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useState } from "react";
import PropTypes from "prop-types";
import ErrorBoundary from "@/lib/ErrorBoundary";

const Boom = ({ crash }) => {
  if (crash) throw new Error("panel crashed");
  return <span>panel</span>;
};
Boom.propTypes = { crash: PropTypes.bool };

describe("ErrorBoundary", () => {
  // React logs the caught error itself; keep the test output readable.
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("clears a shown error when resetKey changes, and only then", () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="key-1">
        <Boom crash />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Re-render on the same history entry: still broken.
    rerender(
      <ErrorBoundary resetKey="key-1">
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // A navigation within the same pathname (new history entry) recovers.
    rerender(
      <ErrorBoundary resetKey="key-2">
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("panel")).toBeInTheDocument();
  });

  it("does not remount healthy children when resetKey changes", () => {
    const mounted = vi.fn();
    const Child = () => {
      // A useState initializer runs exactly once per mount.
      useState(() => mounted());
      return <span>child</span>;
    };

    const { rerender } = render(
      <ErrorBoundary resetKey="key-1">
        <Child />
      </ErrorBoundary>
    );
    rerender(
      <ErrorBoundary resetKey="key-2">
        <Child />
      </ErrorBoundary>
    );

    // A `key`-based reset would have torn the subtree down and remounted it,
    // losing in-progress input state on every debounced filter change.
    expect(mounted).toHaveBeenCalledTimes(1);
  });
});
