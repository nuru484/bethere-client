// src/hooks/useAttendance.jsx
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  createAttendance,
  createAttendanceChallenge,
  createAttendanceStepChallenge,
  submitAttendanceStep,
  updateAttendance,
  getUserAttendance,
  getEventAttendance,
  getUserEventAttendance,
} from "@/api/attendance";
import { getVenueCodes } from "@/api/event";
import { queryKeys } from "@/api/query-keys";

// Step 1 of check-in/check-out: prove presence with the scanned venue code and
// request the liveness challenge. `mode` is "in" or "out". Not cached - each
// challenge is single-use, so this is a plain mutation with no invalidations.
export const useRequestAttendanceChallenge = () =>
  useMutation({
    mutationFn: ({ eventId, venueCode, mode }) =>
      createAttendanceChallenge(eventId, { venueCode, mode }),
  });

// Checking in/out is THE core action: refresh everything it changes that the
// user can see. Prefix invalidation via the keys factory catches every
// params/user variant of the attendance lists and the dashboard panels.
export const useInvalidateAfterAttendance = () => {
  const queryClient = useQueryClient();

  return (eventId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance.usersAll });
    queryClient.invalidateQueries({
      queryKey: queryKeys.attendance.userEventsAll,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.attendance.eventAll(eventId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.events.detail(eventId),
    });
    // The events list and detail embed viewerAttendance/currentSession for
    // the caller (they drive the Sign in / Sign out buttons), so a check-in
    // must refresh them too or the buttons keep their pre-check-in state.
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.userTotals });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.userAttendanceDataAll,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.recentEvents,
    });
    // Admin-side panels showing the same check-in. These need their own
    // entries: ["usersAttendanceData"] above is not a prefix of
    // ["allUsersAttendanceData", params], so the admin chart would otherwise
    // keep serving the pre-check-in numbers for the full staleTime.
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.adminTotals });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.allUsersAttendanceDataAll,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.attendance.reportAll,
    });
  };
};

// Step 2 of check-in: upload the captured frames. `formData` is a FormData
// instance built by the caller.
export const useCreateAttendance = () => {
  const invalidateAfterAttendance = useInvalidateAfterAttendance();

  return useMutation({
    mutationFn: ({ eventId, formData }) => createAttendance(eventId, formData),
    onSuccess: (data, { eventId }) => invalidateAfterAttendance(eventId),
  });
};

// Check-out step 2: upload the captured frames as a PUT multipart, same
// `{ eventId, formData }` shape as create.
export const useUpdateAttendance = () => {
  const invalidateAfterAttendance = useInvalidateAfterAttendance();

  return useMutation({
    mutationFn: ({ eventId, formData }) => updateAttendance(eventId, formData),
    onSuccess: (data, { eventId }) => invalidateAfterAttendance(eventId),
  });
};

// Step-by-step: request a step challenge (single-use, so a plain mutation).
export const useRequestAttendanceStepChallenge = () =>
  useMutation({
    mutationFn: ({ eventId, venueCode, mode }) =>
      createAttendanceStepChallenge(eventId, { venueCode, mode }),
  });

// Step-by-step: submit ONE action's burst. Only the final (done) step changes
// what the user sees, so the attendance-wide invalidation runs only then.
export const useSubmitAttendanceStep = () => {
  const invalidateAfterAttendance = useInvalidateAfterAttendance();

  return useMutation({
    mutationFn: ({ eventId, formData, mode }) =>
      submitAttendanceStep(eventId, formData, mode),
    onSuccess: (response, { eventId }) => {
      if (response?.data?.done) invalidateAfterAttendance(eventId);
    },
  });
};

// Admin venue display: fetch a batch of upcoming rotating venue codes. Kept
// fresh but short-lived - the codes rotate every periodMs and the page refetches
// a new batch before the current one runs out.
export const useVenueCodes = (eventId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.events.venueCodes(eventId),
    queryFn: () => getVenueCodes(eventId),
    ...options,
    // Deliberate, and AFTER the options spread so no caller can silently
    // defeat it: rotating codes must never be served from a stale cache.
    staleTime: 0,
    gcTime: 1000 * 60,
  });
};

// Attendance rows change from OTHER devices - people check in while an admin
// watches the roster - so these three opt back into focus refetching that the
// global default turns off. Without it a returning tab shows a roster up to
// the 5-minute staleTime out of date, with no way to tell.
export const useGetUserAttendance = (userId, params = {}) => {
  return useQuery({
    queryKey: queryKeys.attendance.user(userId, params),
    queryFn: () => getUserAttendance(userId, params),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};

export const useGetEventAttendance = (eventId, params = {}) => {
  return useQuery({
    queryKey: queryKeys.attendance.event(eventId, params),
    queryFn: () => getEventAttendance(eventId, params),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};

export const useGetUserEventAttendance = (userId, eventId, params = {}) => {
  return useQuery({
    queryKey: queryKeys.attendance.userEvent(userId, eventId, params),
    queryFn: () => getUserEventAttendance(userId, eventId, params),
    enabled: !!(userId && eventId),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};
