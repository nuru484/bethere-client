// src/components/attendance/MarkAttendance.test.jsx
//
// Drives the step-by-step check-in state machine with the scanner, the step
// capture surface, and the api hooks stubbed out: a valid scan exchanges the
// venue code for a step challenge and drops into capture; each verified action
// advances to the next; a missed action (STEP_FAILED) stays on the same step to
// retry; an expired challenge resets to a fresh scan; the final step shows the
// confirmation and arms a redirect timer that unmount must clean up.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PropTypes from "prop-types";
import MarkAttendance from "@/components/attendance/MarkAttendance";
import AuthContext from "@/context/AuthContext";

const requestChallengeMutate = vi.fn();
const submitStepMutate = vi.fn();

vi.mock("@/hooks/useAttendance", () => ({
  useRequestAttendanceStepChallenge: () => ({
    mutate: requestChallengeMutate,
    isPending: false,
  }),
  useSubmitAttendanceStep: () => ({
    mutate: submitStepMutate,
    isPending: false,
  }),
  useInvalidateAfterAttendance: () => vi.fn(),
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

// The step capture stub surfaces the current action/step and the retry message,
// and can emit a full or empty burst of frames up to MarkAttendance.
vi.mock("@/components/attendance/StepLivenessCapture", () => {
  const StepLivenessCaptureStub = ({
    action,
    stepNumber,
    totalSteps,
    errorMessage,
    onFrames,
  }) => (
    <div>
      <p>step-capture</p>
      <p>
        action:{action} step:{stepNumber}/{totalSteps}
      </p>
      {errorMessage && <p>err:{errorMessage}</p>}
      <button
        type="button"
        onClick={() => onFrames(Array.from({ length: 6 }, () => new Blob()))}
      >
        emit frames
      </button>
      <button type="button" onClick={() => onFrames([])}>
        emit empty
      </button>
    </div>
  );
  StepLivenessCaptureStub.propTypes = {
    action: PropTypes.string,
    stepNumber: PropTypes.number,
    totalSteps: PropTypes.number,
    errorMessage: PropTypes.string,
    onFrames: PropTypes.func.isRequired,
  };
  return { default: StepLivenessCaptureStub };
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
      data: {
        challengeToken: "challenge-1",
        nextAction: "BLINK",
        currentStep: 0,
        totalSteps: 3,
      },
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

  it("advances from scan to the first capture step on a valid scan", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();

    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    await scanValidCode(user);

    expect(requestChallengeMutate).toHaveBeenCalledWith(
      { eventId: 7, venueCode: "CODE123", mode: "in" },
      expect.any(Object)
    );
    expect(screen.getByText("step-capture")).toBeInTheDocument();
    expect(screen.getByText("action:BLINK step:1/3")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });

  it("advances to the next action after a step is verified", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    submitStepMutate.mockImplementation((vars, { onSuccess }) =>
      onSuccess({
        data: { done: false, nextAction: "SMILE", currentStep: 1, totalSteps: 3 },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit frames" }));

    expect(screen.getByText("action:SMILE step:2/3")).toBeInTheDocument();
  });

  it("stays on the same step and shows a retry when an action is missed", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    submitStepMutate.mockImplementation((vars, { onError }) =>
      onError({
        status: 401,
        data: { status: "error", code: "STEP_FAILED", message: "We didn't catch your blink." },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit frames" }));

    // Still on step 1, with the retry message - not bounced to the scanner.
    expect(screen.getByText("action:BLINK step:1/3")).toBeInTheDocument();
    expect(screen.getByText("err:We didn't catch your blink.")).toBeInTheDocument();
    expect(screen.queryByText(/qr-scanner/)).not.toBeInTheDocument();
  });

  it("resets to a fresh scan when the challenge expires", async () => {
    const user = userEvent.setup();
    renderMarkAttendance();
    await scanValidCode(user);

    submitStepMutate.mockImplementation((vars, { onError }) =>
      onError({
        status: 401,
        data: {
          status: "error",
          code: "CHALLENGE_EXPIRED",
          message: "Your scan session expired.",
        },
      })
    );
    await user.click(screen.getByRole("button", { name: "emit frames" }));

    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(
      screen.getByText(/Your scan session expired\. Please scan the venue code again\./)
    ).toBeInTheDocument();
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

    expect(toast.error).toHaveBeenCalledWith("This code is for a different event.");
    expect(
      screen.getByText("This code is for a different event.")
    ).toBeInTheDocument();
    expect(screen.getByText(/qr-scanner/)).toBeInTheDocument();
    expect(screen.queryByText("step-capture")).not.toBeInTheDocument();
  });

  it("shows the confirmation on the final step and survives unmount before redirect", async () => {
    const user = userEvent.setup();
    const view = renderMarkAttendance();
    await scanValidCode(user);

    submitStepMutate.mockImplementation((vars, { onSuccess }) =>
      onSuccess({ data: { done: true }, message: "Checked in successfully!" })
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
