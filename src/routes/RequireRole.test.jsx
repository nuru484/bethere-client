import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireRole from "@/routes/RequireRole";
import AuthContext from "@/context/AuthContext";

const renderWithUser = (user, role = "ADMIN") =>
  render(
    <AuthContext.Provider
      value={{ user, isLoading: false, login: () => {}, logout: () => {} }}
    >
      <MemoryRouter initialEntries={["/dashboard/users"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard home</div>} />
          <Route
            path="/dashboard/users"
            element={
              <RequireRole role={role}>
                <div>Admin only content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("RequireRole", () => {
  it("renders children for an ADMIN user", () => {
    renderWithUser({ id: 1, role: "ADMIN" });

    expect(screen.getByText("Admin only content")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard home")).not.toBeInTheDocument();
  });

  it("redirects a USER to /dashboard", () => {
    renderWithUser({ id: 2, role: "USER" });

    expect(screen.queryByText("Admin only content")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard home")).toBeInTheDocument();
  });

  it("redirects when there is no user", () => {
    renderWithUser(null);

    expect(screen.queryByText("Admin only content")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard home")).toBeInTheDocument();
  });

  it("renders children when the user's role is in an allowed array", () => {
    renderWithUser({ id: 3, role: "USER" }, ["ADMIN", "USER"]);

    expect(screen.getByText("Admin only content")).toBeInTheDocument();
  });

  it("redirects when the user's role is not in the allowed array", () => {
    renderWithUser({ id: 4, role: "USER" }, ["ADMIN", "SUPERVISOR"]);

    expect(screen.queryByText("Admin only content")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard home")).toBeInTheDocument();
  });
});
