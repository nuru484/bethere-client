// src/components/attendance-table/attendanceColumns.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createAttendanceColumns,
  getStatusChipClass,
} from "./attendanceColumns";

const checkOutCell = (context, row) =>
  createAttendanceColumns({ context })
    .find((col) => col.accessorKey === "checkOutTime")
    .cell({
      row: {
        getValue: (key) => row[key],
        original: row,
      },
    });

describe("checkOut column", () => {
  it("attributes a system auto-checkout to the system", () => {
    render(
      checkOutCell("user", {
        checkOutTime: "2026-07-20T17:00:00.000Z",
        autoCheckedOut: true,
      })
    );

    const chip = screen.getByText(/by system/i);
    expect(chip).toBeInTheDocument();
    // The tooltip explains what "By system" means.
    expect(chip).toHaveAttribute("title", expect.stringMatching(/automatic/i));
  });

  it("shows no system chip for a user-performed checkout", () => {
    render(
      checkOutCell("user", {
        checkOutTime: "2026-07-20T17:00:00.000Z",
        autoCheckedOut: false,
      })
    );

    expect(screen.queryByText(/by system/i)).not.toBeInTheDocument();
  });

  it("still renders the empty label when not checked out", () => {
    render(checkOutCell("user", { checkOutTime: null }));

    expect(screen.getByText("Not checked out")).toBeInTheDocument();
  });
});

describe("column set", () => {
  it("has no row-selection column (no bulk action exists)", () => {
    for (const context of ["user", "event", "userEvent"]) {
      const ids = createAttendanceColumns({ context }).map(
        (col) => col.id ?? col.accessorKey
      );
      expect(ids).not.toContain("select");
    }
  });
});

describe("status chips", () => {
  it("carries a dark-theme text color for every status", () => {
    for (const status of ["PRESENT", "LATE", "ABSENT"]) {
      expect(getStatusChipClass(status)).toMatch(/dark:text-/);
    }
  });
});
