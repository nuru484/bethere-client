import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import PropTypes from "prop-types";
import { useState } from "react";

const EventActionsSidebar = ({
  event,
  user,
  onDelete,
  isDeleting,
  userAttendances = [],
  isLoadingAttendance,
  currentSession,
}) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  // Only USER-role principals are attendants: admins never see personal
  // sign-in / sign-out controls.
  const isAttendant = user?.role === "USER";
  // Signing in burns a rotating venue code and a single-use challenge before the
  // server can reject an un-enrolled face (and files an anomaly for it), so send
  // them to enroll instead. Only an explicit false means "not enrolled".
  const needsFaceScan = isAttendant && user?.hasFaceScan === false;
  const isRecurringEvent = event?.isRecurring;

  // Find attendance for the current session
  const currentSessionAttendance = currentSession
    ? userAttendances.find((att) => att.sessionId === currentSession.id)
    : null;

  // For non-recurring events, find the most recent attendance
  const latestAttendance =
    !isRecurringEvent && userAttendances.length > 0
      ? userAttendances.reduce((latest, current) => {
          const latestTime = new Date(latest.checkInTime).getTime();
          const currentTime = new Date(current.checkInTime).getTime();
          return currentTime > latestTime ? current : latest;
        }, userAttendances[0])
      : null;

  // Determine sign-in/sign-out status based on event type
  let hasSignedIn, hasSignedOut, showSignInButton, showSignOutButton;

  if (isRecurringEvent && currentSession) {
    // For recurring events: check current session attendance
    hasSignedIn = currentSessionAttendance?.checkInTime;
    hasSignedOut = currentSessionAttendance?.checkOutTime;

    showSignInButton = !hasSignedIn;
    showSignOutButton = hasSignedIn && !hasSignedOut;
  } else if (!isRecurringEvent) {
    // For non-recurring events: check latest attendance
    hasSignedIn = latestAttendance?.checkInTime;
    hasSignedOut = latestAttendance?.checkOutTime;

    // Only show sign-in if user has never signed in
    showSignInButton = !hasSignedIn;
    // Only show sign-out if user has signed in but hasn't signed out yet
    showSignOutButton = hasSignedIn && !hasSignedOut;
  } else {
    // If recurring but no current session, show both buttons
    showSignInButton = true;
    showSignOutButton = true;
  }

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const handleSignIn = () => {
    navigate(`/dashboard/events/${event.id}/attendance-in`);
  };

  const handleAddFaceScan = () => {
    navigate("/dashboard/add-facescan");
  };

  const handleSignOut = () => {
    navigate(`/dashboard/events/${event.id}/attendance-out`);
  };

  const handleViewAttendance = () => {
    navigate(`/dashboard/events/${event.id}/attendance`);
  };

  const handleViewMyAttendance = () => {
    navigate(`/dashboard/attendance/user/${user.id}/event/${event.id}`);
  };

  const handleEditEvent = () => {
    navigate(`/dashboard/events/${event.id}/edit`);
  };

  const handleShowVenueCode = () => {
    navigate(`/dashboard/events/${event.id}/venue-code`);
  };

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader className="pb-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
            Quick Actions
          </h3>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Sign In Button - enrolled attendants only */}
          {isAttendant && showSignInButton && !needsFaceScan && (
            <Button
              className="w-full justify-start"
              onClick={handleSignIn}
              disabled={isLoadingAttendance}
            >
              Sign In to Event
            </Button>
          )}

          {/* Un-enrolled attendants get the enrolment step instead */}
          {showSignInButton && needsFaceScan && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <p
                id="facescan-required-note"
                className="text-sm leading-snug text-muted-foreground"
              >
                Add your face scan before you can sign in to events.
              </p>
              <Button
                className="w-full justify-start"
                onClick={handleAddFaceScan}
                aria-describedby="facescan-required-note"
              >
                Add Face Scan
              </Button>
            </div>
          )}

          {/* Sign Out Button - attendants only */}
          {isAttendant && showSignOutButton && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
              disabled={isLoadingAttendance}
            >
              Sign Out of Event
            </Button>
          )}

          {/* View My Attendance: a user's own record for THIS event. Admins
              have no attendance rows; the backend answers with an empty
              page and the view renders its empty state. */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleViewMyAttendance}
          >
            My Event Attendance
          </Button>

          {/* Admin Actions */}
          {isAdmin && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleViewAttendance}
              >
                Event Attendance
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleShowVenueCode}
              >
                Show Venue Code
              </Button>

              <Separator className="my-4" />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleEditEvent}
              >
                Edit Event
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone and will permanently remove all event data including attendance records."
        onConfirm={handleDelete}
        confirmText="Delete Event"
        cancelText="Cancel"
        isDestructive={true}
        requireExactMatch="DELETE"
      />
    </>
  );
};

EventActionsSidebar.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    isRecurring: PropTypes.bool,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    hasFaceScan: PropTypes.bool,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
  userAttendances: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      checkInTime: PropTypes.string,
      checkOutTime: PropTypes.string,
      status: PropTypes.string,
      sessionId: PropTypes.number,
    })
  ),
  isLoadingAttendance: PropTypes.bool,
  currentSession: PropTypes.shape({
    id: PropTypes.number,
    eventId: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }),
};

export default EventActionsSidebar;
