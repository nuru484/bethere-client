// src/components/attendance/MarkAttendance.test.jsx
//
// Drives the two-step check-in state machine with the scanner, the liveness
// capture and the api hooks stubbed out: a valid scan exchanges the venue
// code for a challenge and advances to capture; a failed exchange or a bad
// burst resets to a fresh scan (challenges are single-use); success shows
// the confirmation and arms a redirect timer that unmount must clean up.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PropTypes from "prop-types";
import MarkAttendance from "@/components/attendance/MarkAttendance";
import AuthContext from "@/context/AuthContext";

const requestChallengeMutate = vi.fn();
const createAttendanceMutate = vi.fn();
const updateAttendanceMutate = vi.fn();

vi.mock("@/hooks/useAttendance", () => ({
  useRequestAttendanceChallenge: () => ({
    mutate: requestChallengeMutate,
    isPending: false,
  }),
  useCreateAttendance: () => ({
    mutate: createAttendanceMutate,
    isPending: false,
  }),
  useUpdateAttendance: () => ({
    mutate: updateAttendanceMutate,
    isPending: false,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => "toast-id"),
  },
}));

// Lightweight stand-ins: the real scanner/capture need a camera. The stubs
// expose buttons that hand a fixed code / burst up to MarkAttendance.
vi.mock("@/components/attendance/QrScanner", () => {
  const QrScannerStub = ({ onScan, eventId }) => (
    <div>
      <p>qr-scanner (event {eventId})</p>
      <button type="button" onClick={() => onScan("CODE123")}>
        emit scan
      </button>
    </div>
  );
  QrScannerStub.propTypes = {
    onScan: PropTypes.func.isRequired,
    eventId: PropTypes.number,
  };
  return { default: QrScannerStub };
});

vi.mock("@/components/attendance/LivenessCapture", () => {
  const LivenessCaptureStub = ({ onCapture }) => (
    <div>
      <p>liveness-capture</p>
      <button
        type="button"
        onClick={() => onCapture(Array.from({ length: 6 }, () => new Blob()))}
      >
        emit burst
      </button>
      <button type="button" onClick={() => onCapture([])}>
        emit empty burst
      </button>
    </div>
  );
  LivenessCaptureStub.propTypes = { onCapture: PropTypes.func.isRequired };
  return { default: LivenessCaptureStub };
});

import toast from "react-hot-toast";

const renderMarkAttendance = ({ eventId = "7" } = {}) =>
  render(
    <AuthContext.Provider
      value={{
        user: { id: 5, role: "USER" },
        isLoading: false,
        login: () => {},
        logout: () => {},
      }}
    >
      <MemoryRouter initialEntries={[`/dashboard/events/${eventId}/attendance-in`]}>
        <Routes>
          <Route
            path="/dashboard/events/:eventId/attendance-in"
            element={<MarkAttendance type="in" />}
          />
          <Route
            path="/dashboard/events/:eventId"
            element={<div>event details page</div>}
          />
          <Route path="/dashboard/events" element={<div>events list</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const scanValidCode = async (user) => {
  requestChallengeMutate.mockImplementation((vars, { onSuccess }) =>
    onSuccess({
      data: { challengeToken: "challenge-1", actions: ["BLINK"] },
    })
  );
  await user.click(screen.getByRole("button", { name: "emit scan" }));
};

describe("MarkAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances from scan to capture when a valid payload is scanned", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();

    await scanValidCode(user);

    // The venue code was exchanged with the numeric event id and mode.
    expect(requestChallengeMutate).toHaveBeenCalledWith(
      { eventId: 7, venueCode: "CODE123", mode: "in" },
      expect.any(Object)
    );
    expect(screen.getByText("liveness-capture")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });

  it("shows non-fatal feedback and keeps scanning when the code is rejected", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    requestChallengeMutate.mockImplementation((vars, { onError }) =>
      onError({
        status: 400,
        data: { status: "error", message: "This code is for a different event." },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit scan" }));

    expect(toast.error).toHaveBeenCalledWith(
      "This code is for a different event."
    );
    // Back on the scan stage with the message visible - not a dead end.
    expect(
      screen.getByText("This code is for a different event.")
    ).toBeInTheDocument();
    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(screen.queryByText("liveness-capture")).not.toBeInTheDocument();
  });

  it("resets to a fresh scan when the burst is too small (single-use challenge)", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    await scanValidCode(user);
    await user.click(screen.getByRole("button", { name: "emit empty burst" }));

    // Nothing was uploaded and the flow restarted from the scanner.
    expect(createAttendanceMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(
      screen.getByText(/Could not capture enough frames/)
    ).toBeInTheDocument();
  });

  it("resets to a fresh scan when the upload fails", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    await scanValidCode(user);

    createAttendanceMutate.mockImplementation((vars, { onError }) =>
      onError({
        status: 401,
        data: { status: "error", message: "Face did not match." },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit burst" }));

    expect(createAttendanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 7 }),
      expect.any(Object)
    );
    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(
      screen.getByText(/Face did not match\. Please scan the venue code again\./)
    ).toBeInTheDocument();
  });

  it("shows the confirmation on success and survives unmount before the redirect fires", async () => {
    const user = userEvent.setup();
    const view = renderMarkAttendance();

    await scanValidCode(user);

    createAttendanceMutate.mockImplementation((vars, { onSuccess }) =>
      onSuccess({ message: "Checked in successfully!" })
    );

    // Fake timers only for the submit that arms the 1500ms redirect timer,
    // so the test controls when (and whether) it fires. fireEvent is
    // synchronous, so it is safe under fake timers.
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "emit burst" }));

    expect(toast.success).toHaveBeenCalledWith("Checked in successfully!", {
      id: "toast-id",
    });
    expect(screen.getByText("Checked in successfully!")).toBeInTheDocument();

    // Redirect is delayed so the confirmation is readable; unmounting first
    // must clear the timer instead of navigating a dead component.
    view.unmount();
    expect(() => vi.runAllTimers()).not.toThrow();
  });

  it("redirects to the events list for a malformed event id", () => {
    renderMarkAttendance({ eventId: "not-a-number" });

    expect(screen.getByText("events list")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });
});
