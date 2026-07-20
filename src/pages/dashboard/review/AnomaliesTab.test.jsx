import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const resolveMutate = vi.fn();

vi.mock("@/hooks/useReview", () => ({
  useAnomalies: () => ({
    data: {
      data: [
        {
          id: 1,
          type: "LIVENESS_FAILED",
          severity: "MEDIUM",
          detail: { reasons: ["identity_mismatch"] },
          createdAt: "2026-07-20T10:00:00.000Z",
          resolvedAt: null,
          user: { id: 5, firstName: "Jane", lastName: "Doe", email: "jane@x.com" },
          evidence: {
            frameUrls: ["https://cdn.test/frame1.jpg"],
            matchDistance: 0.91,
            livenessScore: 0.08,
          },
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
  }),
  useResolveAnomaly: () => ({ mutate: resolveMutate, isPending: false }),
}));

import AnomaliesTab from "./AnomaliesTab";

describe("AnomaliesTab", () => {
  it("renders a flagged attempt with the attendant, type, evidence and a resolve action", () => {
    render(<AnomaliesTab />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/liveness failed/i)).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    expect(screen.getByAltText(/evidence frame 1/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark resolved/i })
    ).toBeInTheDocument();
  });
});
