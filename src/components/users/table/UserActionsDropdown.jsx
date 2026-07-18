// src/components/users/table/UserActionsDropdown.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Trash2,
  User,
  Calendar,
  CalendarCheck,
  Search,
  Loader2,
  ScanFace,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDeleteUser } from "@/hooks/useUsers";
import { useGetEvents } from "@/hooks/useEvent";
import { useDeleteFaceScan } from "@/hooks/useFaceScanApi";
import PropTypes from "prop-types";

export function UserActionsDropdown({ user }) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faceScanDialogOpen, setFaceScanDialogOpen] = useState(false);
  const [eventSelectionOpen, setEventSelectionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(null);

  const deleteUserMutation = useDeleteUser();
  const deleteFaceScanMutation = useDeleteFaceScan();

  // Fetch events with search
  const { data: eventsData, isLoading: isEventsLoading } = useGetEvents({
    page: 1,
    limit: 50,
    search: searchTerm,
  });

  const handleDeleteUser = async () => {
    const toastId = toast.loading("Deleting user...");

    try {
      const response = await deleteUserMutation.mutateAsync(user.id);
      toast.dismiss(toastId);
      toast.success(response.message || "User deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to delete user");
      setDeleteDialogOpen(false);
    }
  };

  const handleResetFaceScan = async () => {
    const toastId = toast.loading("Resetting face scan...");

    try {
      const response = await deleteFaceScanMutation.mutateAsync({
        userId: user.id,
      });
      toast.dismiss(toastId);
      toast.success(response.message || "Face scan reset successfully");
      setFaceScanDialogOpen(false);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to reset face scan");
      setFaceScanDialogOpen(false);
    }
  };

  const handleEventSelection = () => {
    if (selectedEventId) {
      navigate(
        `/dashboard/attendance/user/${user.id}/event/${selectedEventId}`
      );
      setEventSelectionOpen(false);
      setSelectedEventId(null);
      setSearchTerm("");
    }
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
  };

  const availableEvents = eventsData?.data || [];

  const hasFaceScan = user.hasFaceScan === true;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:cursor-pointer">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View User Details */}
          <DropdownMenuItem
            onClick={() => navigate(`/dashboard/users/${user.id}/profile`)}
            className="hover:cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {/* View Attendance */}
          <DropdownMenuItem
            onClick={() => navigate(`/dashboard/attendance/${user.id}`)}
            className="hover:cursor-pointer"
          >
            <Calendar className="mr-2 h-4 w-4" />
            View Attendance
          </DropdownMenuItem>

          {/* View Event Attendance */}
          <DropdownMenuItem
            onClick={() => setEventSelectionOpen(true)}
            className="hover:cursor-pointer"
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            Event Attendance
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {hasFaceScan && (
            <DropdownMenuItem
              className="text-orange-600 hover:cursor-pointer"
              onClick={() => setFaceScanDialogOpen(true)}
            >
              <ScanFace className="mr-2 h-4 w-4" />
              Reset Face Scan
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="text-red-600 hover:cursor-pointer"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${user.firstName} ${user.lastName}"? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      <ConfirmationDialog
        open={faceScanDialogOpen}
        onOpenChange={setFaceScanDialogOpen}
        title="Reset Face Scan"
        description={`Are you sure you want to reset the face scan data for "${user.firstName} ${user.lastName}"? This will require them to register their face again for attendance.`}
        onConfirm={handleResetFaceScan}
        confirmText="Reset Face Scan"
        cancelText="Cancel"
        isDestructive={true}
      />

      {/* Event Selection Dialog */}
      <Dialog open={eventSelectionOpen} onOpenChange={setEventSelectionOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Select Event
            </DialogTitle>
            <DialogDescription className="text-sm">
              Choose an event to view {user.firstName}&apos;s attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label
                htmlFor="event-search"
                className="text-sm font-medium break-words"
              >
                Search Events
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="event-search"
                  placeholder="Search by title, type, or location..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>

            {/* Event Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="event-select"
                className="text-sm font-medium break-words"
              >
                Select Event
              </Label>
              <Select
                value={selectedEventId ? String(selectedEventId) : ""}
                onValueChange={(val) => setSelectedEventId(Number(val))}
              >
                <SelectTrigger id="event-select" className="w-full">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] max-w-[calc(100vw-4rem)] sm:max-w-[468px] flex">
                  {isEventsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : availableEvents.length > 0 ? (
                    availableEvents.map((event) => (
                      <SelectItem
                        key={event.id}
                        value={String(event.id)}
                        className="py-3"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 w-full">
                          <span className="font-medium text-sm break-all line-clamp-2">
                            {event.title}
                          </span>
                          <span className="text-xs text-muted-foreground break-all line-clamp-1">
                            {event.type} •{" "}
                            {event.location?.city || event.location?.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <CalendarCheck className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No events found
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEventSelectionOpen(false);
                setSelectedEventId(null);
                setSearchTerm("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEventSelection}
              disabled={!selectedEventId}
              className="w-full sm:w-auto"
            >
              <CalendarCheck className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">View Attendance</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

UserActionsDropdown.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string,
    hasFaceScan: PropTypes.bool,
  }).isRequired,
};
