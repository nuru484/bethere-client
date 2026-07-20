// src/hooks/useAttendanceActions.test.jsx
//
// The sign-in/sign-out derivation was duplicated (~40 lines, verbatim)
// between EventListItem and EventActionsSidebar before being extracted here;
// this suite pins the shared behavior, including the fixed "recurring event
// with no current session offered Sign out to someone who never signed in"
// state and the system auto-checkout attribution.
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import PropTypes from "prop-types";
import AuthContext from "@/context/AuthContext";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";

const attendant = { id: 1, role: "USER" };
const admin = { id: 2, role: "ADMIN" };

const withUser = (user) => {
  const Wrapper = ({ children }) => (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
  Wrapper.propTypes = { children: PropTypes.node };
  return Wrapper;
};

const renderActions = (event, user = attendant) =>
  renderHook(() => useAttendanceActions(event), { wrapper: withUser(user) })
    .result.current;

const session = { id: 11, startDate: "2026-07-20", endDate: "2026-07-20" };

describe("useAttendanceActions", () => {
  it("offers Sign in when a session is live and the viewer has no attendance", () => {
    const actions = renderActions({
      id: 5,
      currentSession: session,
      viewerAttendance: null,
    });

    expect(actions).toMatchObject({
      isAttendant: true,
      showSignIn: true,
      showSignOut: false,
    });
  });

  it("offers Sign out after a check-in with no check-out", () => {
    const actions = renderActions({
      id: 5,
      currentSession: session,
      viewerAttendance: {
        sessionId: 11,
        status: "PRESENT",
        checkInTime: "2026-07-20T09:00:00.000Z",
        checkOutTime: null,
      },
    });

    expect(actions).toMatchObject({ showSignIn: false, showSignOut: true });
  });

  it("offers nothing once checked out", () => {
    const actions = renderActions({
      id: 5,
      currentSession: session,
      viewerAttendance: {
        sessionId: 11,
        status: "PRESENT",
        checkInTime: "2026-07-20T09:00:00.000Z",
        checkOutTime: "2026-07-20T17:00:00.000Z",
      },
    });

    expect(actions).toMatchObject({ showSignIn: false, showSignOut: false });
  });

  it("treats a system auto-checkout as checked out, with attribution", () => {
    const actions = renderActions({
      id: 5,
      currentSession: session,
      viewerAttendance: {
        sessionId: 11,
        status: "PRESENT",
        checkInTime: "2026-07-20T09:00:00.000Z",
        checkOutTime: "2026-07-20T17:00:00.000Z",
        autoCheckedOut: true,
      },
    });

    expect(actions).toMatchObject({
      showSignIn: false,
      showSignOut: false,
      wasAutoCheckedOut: true,
    });
  });

  it("offers neither button when there is no current session", () => {
    // The old duplicated derivation showed BOTH buttons for a recurring
    // event with no session today - including Sign out for someone who had
    // never signed in. The server would reject either attempt anyway.
    const actions = renderActions({
      id: 5,
      isRecurring: true,
      currentSession: null,
      viewerAttendance: null,
    });

    expect(actions).toMatchObject({ showSignIn: false, showSignOut: false });
  });

  it("never offers buttons to admins", () => {
    const actions = renderActions(
      { id: 5, currentSession: session, viewerAttendance: null },
      admin
    );

    expect(actions).toMatchObject({
      isAttendant: false,
      showSignIn: false,
      showSignOut: false,
    });
  });

  it("handles a missing event", () => {
    const actions = renderActions(undefined);

    expect(actions).toMatchObject({ showSignIn: false, showSignOut: false });
  });
});
