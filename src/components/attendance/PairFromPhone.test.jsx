// src/components/attendance/PairFromPhone.test.jsx
//
// The laptop side of the phone hand-off: starting a pairing renders the QR, and
// a poll that reports COMPLETED fires onComplete. The pairing api is stubbed.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PairFromPhone from "@/components/attendance/PairFromPhone";

const startPairing = vi.fn();
const getPairingStatus = vi.fn();

vi.mock("@/api/pairing", () => ({
  startPairing: (...args) => startPairing(...args),
  getPairingStatus: (...args) => getPairingStatus(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const renderPaired = (props = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PairFromPhone scope="ATTENDANCE" eventId={7} mode="in" {...props} />
    </QueryClientProvider>
  );
};

describe("PairFromPhone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a pairing and renders the QR, then fires onComplete when the phone finishes", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    startPairing.mockResolvedValue({
      data: { pairingId: "p1", handoffToken: "tok-123" },
    });
    getPairingStatus.mockResolvedValue({ data: { status: "COMPLETED" } });

    const { container } = renderPaired({ onComplete });

    await user.click(screen.getByRole("button", { name: /scan from phone/i }));

    // A QR (svg) is rendered for the hand-off link.
    await waitFor(() =>
      expect(container.querySelector("svg")).toBeInTheDocument()
    );
    expect(startPairing).toHaveBeenCalledWith({
      scope: "ATTENDANCE",
      eventId: 7,
      mode: "in",
    });

    // The poll reports completion -> the parent is notified.
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(screen.getByText(/done on your phone/i)).toBeInTheDocument();
  });

  it("surfaces an error when starting the pairing fails", async () => {
    const user = userEvent.setup();
    startPairing.mockRejectedValue({
      status: 500,
      data: { status: "error", message: "Could not start." },
    });

    renderPaired();
    await user.click(screen.getByRole("button", { name: /scan from phone/i }));

    await waitFor(() =>
      expect(screen.getByText("Could not start.")).toBeInTheDocument()
    );
  });
});
