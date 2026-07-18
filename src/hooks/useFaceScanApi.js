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
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["facescan", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};

export const useDeleteFaceScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }) => deleteFaceScan(userId),
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["facescan"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};
