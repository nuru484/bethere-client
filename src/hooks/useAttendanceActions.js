// src/hooks/useAttendanceActions.js
//
// One source of truth for the Sign in / Sign out button state. The events
// endpoints embed, for USER-kind callers, the event's current session (today,
// in the venue timezone) and the caller's attendance row for it:
//   currentSession:   { id, startDate, endDate } | null
//   viewerAttendance: { sessionId, status, checkInTime, checkOutTime,
//                       autoCheckedOut } | null
// Both fields are absent for admins. Driving the buttons off those embedded
// fields replaced a per-card attendance query (a page of 25 event cards used
// to fire 25 API calls) and the ~40 lines of derivation duplicated between
// EventListItem and EventActionsSidebar.
import { useAuth } from "@/hooks/useAuth";

export const useAttendanceActions = (event) => {
  const { user } = useAuth();

  // Only USER-role principals are attendants: admins never see personal
  // sign-in / sign-out controls.
  const isAttendant = user?.role === "USER";

  const currentSession = event?.currentSession ?? null;
  const viewerAttendance = event?.viewerAttendance ?? null;

  if (!isAttendant || !event) {
    return {
      isAttendant,
      showSignIn: false,
      showSignOut: false,
      wasAutoCheckedOut: false,
      currentSession: null,
      viewerAttendance: null,
    };
  }

  const hasSignedIn = Boolean(viewerAttendance?.checkInTime);
  // A system auto sign-out (session ended before the user signed out) counts
  // as checked out for button logic; the UI attributes it to the system.
  const hasSignedOut =
    Boolean(viewerAttendance?.checkOutTime) ||
    Boolean(viewerAttendance?.autoCheckedOut);

  // No current session means there is nothing to sign in to (the server
  // would reject the attempt anyway) - so neither button shows. This also
  // fixes the old "recurring event with no session today" state, which
  // offered Sign out to someone who had never signed in.
  const showSignIn = Boolean(currentSession) && !hasSignedIn;
  const showSignOut = Boolean(currentSession) && hasSignedIn && !hasSignedOut;

  return {
    isAttendant,
    showSignIn,
    showSignOut,
    wasAutoCheckedOut: Boolean(viewerAttendance?.autoCheckedOut),
    currentSession,
    viewerAttendance,
  };
};
