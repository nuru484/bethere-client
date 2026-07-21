// src/hooks/useFaceScanApi.js
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  deleteFaceScan,
  addFaceScan,
  createEnrollmentChallenge,
  createEnrollmentStepChallenge,
  submitEnrollmentStep,
  getUserFaceScan,
} from "@/api/faceScan";
import { queryKeys } from "@/api/query-keys";

export const useGetUserFaceScan = (userId) => {
  return useQuery({
    queryKey: queryKeys.faceScan.detail(userId),
    queryFn: () => getUserFaceScan(userId),
    refetchOnReconnect: false,
  });
};

// Step 1 of enrollment: request the liveness challenge. Not cached - each
// challenge is single-use, so this is a plain mutation with no invalidations.
export const useRequestEnrollmentChallenge = () =>
  useMutation({
    mutationFn: () => createEnrollmentChallenge(),
  });

// Step 2 of enrollment: upload the captured frames. `formData` is a FormData
// instance built by the caller.
export const useAddFaceScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => addFaceScan(formData),
    onSuccess: (data) => {
      // Self-enrollment: the enrolled user id comes back on the response,
      // not in the mutation variables (an opaque FormData).
      const userId = data?.data?.user?.id;
      queryClient.invalidateQueries({
        queryKey: queryKeys.faceScan.detail(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      // The users list carries hasFaceScan and is cached for 5 minutes, so it
      // would keep showing the old enrollment state without this.
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

// Step-by-step enrollment: request a step challenge (single-use).
export const useRequestEnrollmentStepChallenge = () =>
  useMutation({
    mutationFn: () => createEnrollmentStepChallenge(),
  });

// Step-by-step enrollment: submit ONE action's burst. Only the final (done)
// step enrolls the template, so cache invalidation runs only then.
export const useSubmitEnrollmentStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => submitEnrollmentStep(formData),
    onSuccess: (response) => {
      if (!response?.data?.done) return;
      const userId = response?.data?.user?.id;
      queryClient.invalidateQueries({
        queryKey: queryKeys.faceScan.detail(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useDeleteFaceScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }) => deleteFaceScan(userId),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.faceScan.detail(userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
