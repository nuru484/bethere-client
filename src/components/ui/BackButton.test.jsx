// src/components/ui/BackButton.test.jsx
//
// The two paths the header back arrow has to get right: step back into the
// entry the app pushed, and fall back to `to` when the page was opened cold.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import BackButton from "@/components/ui/BackButton";

const renderAt = (entries, index) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={index}>
      <Routes>
        <Route path="/dashboard/events" element={<div>Events list</div>} />
        <Route
          path="/dashboard/events/5"
          element={<BackButton to="/dashboard/events" label="Back to events" />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("BackButton", () => {
  it("names the destination for screen readers", () => {
    renderAt(["/dashboard/events/5"], 0);

    expect(
      screen.getByRole("button", { name: "Back to events" })
    ).toBeInTheDocument();
  });

  it("steps back when the app pushed the current entry", async () => {
    renderAt(["/dashboard/events", "/dashboard/events/5"], 1);

    await userEvent.click(screen.getByRole("button", { name: "Back to events" }));

    expect(screen.getByText("Events list")).toBeInTheDocument();
  });

  it("navigates to the destination when the page was opened directly", async () => {
    renderAt(["/dashboard/events/5"], 0);

    await userEvent.click(screen.getByRole("button", { name: "Back to events" }));

    expect(screen.getByText("Events list")).toBeInTheDocument();
  });
});
