// src/hooks/useFaceScanApi.js
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { deleteFaceScan, addFaceScan, getUserFaceScan } from "@/api/faceScan";

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

export const useAddFaceScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => addFaceScan(userData),
    onSuccess: (data) => {
      // Self-enrollment: the enrolled user id comes back on the response,
      // not in the mutation variables ({ faceScan, consent }).
      const userId = data?.data?.user?.id;
      queryClient.invalidateQueries({ queryKey: ["facescan", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
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
    },
  });
};
