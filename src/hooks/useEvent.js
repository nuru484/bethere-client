// src/hooks/useEvent.js
import {
  useQuery,
  useQueryClient,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchEvent,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/api/event";
import { queryKeys } from "@/api/query-keys";

export const useGetEvent = (eventId) => {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => fetchEvent(eventId),
    // Deliberately below the global retry: 2 - event pages have their own
    // retry UI, so surface a failure quickly instead of retrying twice.
    retry: 1,
    // Events are edited by other admins (time, venue, cancellation), so a
    // returning tab refetches rather than trusting the 5-minute staleTime.
    refetchOnWindowFocus: true,
    refetchOnReconnect: false,
  });
};

export const useGetEvents = (params = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => fetchEvents(params),
    // Deliberately below the global retry: 2 (see useGetEvent).
    retry: 1,
    // Focus refetch on for the same reason as useGetEvent.
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    ...options,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => updateEvent(eventId, data),
    onSuccess: (data, { eventId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId }) => deleteEvent(eventId),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(eventId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
