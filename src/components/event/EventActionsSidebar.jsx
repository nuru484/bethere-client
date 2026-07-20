import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
import PropTypes from "prop-types";
import { useState } from "react";

const EventActionsSidebar = ({ event, user, onDelete, isDeleting }) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  // Sign in / Sign out state comes from the attendance fields embedded in
  // the event detail response - shared with EventListItem via the hook.
  const {
    isAttendant,
    showSignIn: showSignInButton,
    showSignOut: showSignOutButton,
    wasAutoCheckedOut,
  } = useAttendanceActions(event);
  // Signing in burns a rotating venue code and a single-use challenge before the
  // server can reject an un-enrolled face (and files an anomaly for it), so send
  // them to enroll instead. Only an explicit false means "not enrolled".
  const needsFaceScan = isAttendant && user?.hasFaceScan === false;

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
            <Button className="w-full justify-start" onClick={handleSignIn}>
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
            >
              Sign Out of Event
            </Button>
          )}

          {/* Auto-checkout attribution: the session ended before the user
              signed out and the system closed the record for them. */}
          {isAttendant && wasAutoCheckedOut && (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-snug text-muted-foreground">
              You were signed out by the system when the session ended.
            </p>
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
    currentSession: PropTypes.shape({
      id: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
    }),
    viewerAttendance: PropTypes.shape({
      sessionId: PropTypes.number,
      status: PropTypes.string,
      checkInTime: PropTypes.string,
      checkOutTime: PropTypes.string,
      autoCheckedOut: PropTypes.bool,
    }),
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    hasFaceScan: PropTypes.bool,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
};

export default EventActionsSidebar;
