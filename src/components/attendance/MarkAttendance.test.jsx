// src/components/attendance/MarkAttendance.test.jsx
//
// Drives the guided one-take check-in state machine with the scanner, the
// guided capture surface, and the api hooks stubbed out: a valid scan
// exchanges the venue code for a batch challenge (ordered actions) and drops
// into capture; the finished burst is uploaded ONCE; a server rejection keeps
// the user on the capture surface with a retry that mints a fresh challenge
// from the stored venue code (no re-scan); a rejected code keeps scanning;
// success shows the confirmation and arms a redirect timer that unmount must
// clean up.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import PropTypes from "prop-types";
import MarkAttendance from "@/components/attendance/MarkAttendance";
import AuthContext from "@/context/AuthContext";

const requestChallengeMutate = vi.fn();
const checkInMutate = vi.fn();
const checkOutMutate = vi.fn();

vi.mock("@/hooks/useAttendance", () => ({
  useRequestAttendanceChallenge: () => ({
    mutate: requestChallengeMutate,
    isPending: false,
  }),
  useCreateAttendance: () => ({ mutate: checkInMutate, isPending: false }),
  useUpdateAttendance: () => ({ mutate: checkOutMutate, isPending: false }),
  useInvalidateAfterAttendance: () => vi.fn(),
}));

// The on-device model must never load in jsdom; the flow only awaits it
// before requesting a challenge.
vi.mock("@/lib/face-landmarker", () => ({
  loadFaceLandmarker: vi.fn(() => Promise.resolve({})),
  preloadFaceLandmarker: vi.fn(),
}));

// The phone hand-off is its own concern (covered elsewhere); stub it so this
// test does not need a QueryClient for its internal pairing hooks.
vi.mock("@/components/attendance/PairFromPhone", () => ({
  default: () => <div>pair-from-phone</div>,
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn(), loading: vi.fn(() => "toast-id") },
}));

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

// The guided capture stub surfaces the challenged actions and the retry
// message, and can emit a full or thin burst, a retry tap, or an expiry.
vi.mock("@/components/attendance/GuidedLivenessCapture", () => {
  const GuidedLivenessCaptureStub = ({
    actions,
    errorMessage,
    onComplete,
    onRetry,
    onExpired,
  }) => (
    <div>
      <p>guided-capture</p>
      <p>actions:{actions.join(",")}</p>
      {errorMessage && <p>err:{errorMessage}</p>}
      <button
        type="button"
        onClick={() => onComplete(Array.from({ length: 9 }, () => new Blob()))}
      >
        emit frames
      </button>
      <button type="button" onClick={() => onComplete([new Blob()])}>
        emit thin burst
      </button>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          stub retry
        </button>
      )}
      {onExpired && (
        <button type="button" onClick={onExpired}>
          stub expire
        </button>
      )}
    </div>
  );
  GuidedLivenessCaptureStub.propTypes = {
    actions: PropTypes.arrayOf(PropTypes.string).isRequired,
    errorMessage: PropTypes.string,
    onComplete: PropTypes.func.isRequired,
    onRetry: PropTypes.func,
    onExpired: PropTypes.func,
  };
  return { default: GuidedLivenessCaptureStub };
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

const CHALLENGE = {
  data: {
    challengeToken: "challenge-1",
    actions: ["BLINK", "SMILE", "TURN_LEFT"],
    expiresAt: null,
  },
};

const scanValidCode = async (user) => {
  requestChallengeMutate.mockImplementation((vars, { onSuccess }) =>
    onSuccess(CHALLENGE)
  );
  await user.click(screen.getByRole("button", { name: "emit scan" }));
  // The challenge request awaits the model preload microtask first.
  await screen.findByText("guided-capture");
};

describe("MarkAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exchanges a valid scan for a batch challenge and enters guided capture", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    await scanValidCode(user);

    expect(requestChallengeMutate).toHaveBeenCalledWith(
      { eventId: 7, venueCode: "CODE123", mode: "in" },
      expect.any(Object)
    );
    expect(screen.getByText("actions:BLINK,SMILE,TURN_LEFT")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });

  it("uploads the finished burst once with the challenge token and venue code", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    checkInMutate.mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "emit frames" }));

    expect(checkInMutate).toHaveBeenCalledTimes(1);
    const { eventId, formData } = checkInMutate.mock.calls[0][0];
    expect(eventId).toBe(7);
    expect(formData.get("challengeToken")).toBe("challenge-1");
    expect(formData.get("venueCode")).toBe("CODE123");
    expect(formData.getAll("frames")).toHaveLength(9);
  });

  it("rejects a thin burst locally without spending the upload", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    await user.click(screen.getByRole("button", { name: "emit thin burst" }));

    expect(checkInMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(/err:We couldn't capture enough of that/)
    ).toBeInTheDocument();
  });

  it("keeps the user on capture after a failed verification and retries with a fresh challenge, no re-scan", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    checkInMutate.mockImplementation((vars, { onError }) =>
      onError({
        status: 401,
        data: { status: "error", message: "Face verification failed." },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit frames" }));

    // Still on the capture surface with the server's reason.
    expect(screen.getByText("err:Face verification failed.")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();

    // Retry mints a NEW challenge from the stored venue code.
    requestChallengeMutate.mockClear();
    requestChallengeMutate.mockImplementation((vars, { onSuccess }) =>
      onSuccess(CHALLENGE)
    );
    await user.click(screen.getByRole("button", { name: "stub retry" }));
    await waitFor(() =>
      expect(requestChallengeMutate).toHaveBeenCalledWith(
        { eventId: 7, venueCode: "CODE123", mode: "in" },
        expect.any(Object)
      )
    );
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });

  it("surfaces a challenge expiry as a retryable capture error", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    await user.click(screen.getByRole("button", { name: "stub expire" }));

    expect(screen.getByText(/err:Time ran out/)).toBeInTheDocument();
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

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("This code is for a different event.")
    );
    expect(
      screen.getByText("This code is for a different event.")
    ).toBeInTheDocument();
    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(screen.queryByText("guided-capture")).not.toBeInTheDocument();
  });

  it("shows the confirmation on success and survives unmount before redirect", async () => {
    const user = userEvent.setup();
    const view = renderMarkAttendance();
    await scanValidCode(user);

    checkInMutate.mockImplementation((vars, { onSuccess }) =>
      onSuccess({ message: "Checked in successfully!" })
    );

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "emit frames" }));

    expect(toast.success).toHaveBeenCalledWith("Checked in successfully!");
    expect(screen.getByText("Checked in successfully!")).toBeInTheDocument();

    view.unmount();
    expect(() => vi.runAllTimers()).not.toThrow();
  });

  it("redirects to the events list for a malformed event id", () => {
    renderMarkAttendance({ eventId: "not-a-number" });

    expect(screen.getByText("events list")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });
});
