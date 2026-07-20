// src/hooks/useFaceScanApi.js
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  deleteFaceScan,
  addFaceScan,
  createEnrollmentChallenge,
  getUserFaceScan,
} from "@/api/faceScan";

export const useGetUserFaceScan = (userId) => {
  return useQuery({
    queryKey: ["facescan", userId],
    queryFn: () => getUserFaceScan(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ["facescan", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // The users list carries hasFaceScan and is cached for 5 minutes, so it
      // would keep showing the old enrollment state without this.
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteFaceScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }) => deleteFaceScan(userId),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["facescan", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
