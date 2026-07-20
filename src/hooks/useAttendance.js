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
  updateAttendance,
  getUserAttendance,
  getEventAttendance,
  getUserEventAttendance,
} from "@/api/attendance";
import { getVenueCodes } from "@/api/event";

// Step 1 of check-in/check-out: prove presence with the scanned venue code and
// request the liveness challenge. `mode` is "in" or "out". Not cached - each
// challenge is single-use, so this is a plain mutation with no invalidations.
export const useRequestAttendanceChallenge = () =>
  useMutation({
    mutationFn: ({ eventId, venueCode, mode }) =>
      createAttendanceChallenge(eventId, { venueCode, mode }),
  });

// Step 2 of check-in: upload the captured frames. `formData` is a FormData
// instance built by the caller.
export const useCreateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, formData }) => createAttendance(eventId, formData),
    onSuccess: (data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["eventAttendance", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
};

// Check-out step 2: upload the captured frames as a PUT multipart, same
// `{ eventId, formData }` shape as create.
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, formData }) => updateAttendance(eventId, formData),
    onSuccess: (data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["eventAttendance", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
};

// Admin venue display: fetch a batch of upcoming rotating venue codes. Kept
// fresh but short-lived - the codes rotate every periodMs and the page refetches
// a new batch before the current one runs out.
export const useVenueCodes = (eventId, options = {}) => {
  return useQuery({
    queryKey: ["venueCodes", eventId],
    queryFn: () => getVenueCodes(eventId),
    staleTime: 0,
    gcTime: 1000 * 60,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetUserAttendance = (userId, params = {}) => {
  const queryKey = ["userAttendance", userId, params];

  return useQuery({
    queryKey,
    queryFn: () => getUserAttendance(userId, params),
    gcTime: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};

export const useGetEventAttendance = (eventId, params = {}) => {
  const queryKey = ["eventAttendance", eventId, params];

  return useQuery({
    queryKey,
    queryFn: () => getEventAttendance(eventId, params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};

export const useGetUserEventAttendance = (userId, eventId, params = {}) => {
  const queryKey = ["userEventAttendance", userId, eventId, params];

  return useQuery({
    queryKey,
    queryFn: () => getUserEventAttendance(userId, eventId, params),
    enabled: !!(userId && eventId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
  });
};
