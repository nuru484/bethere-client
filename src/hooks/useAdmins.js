// src/hooks/useAdmins.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getAdmins, addAdmin, deleteAdmin } from "@/api/admins";

// Get all admins with pagination
export const useGetAllAdmins = (params = {}) => {
  return useQuery({
    queryKey: ["admins", params],
    queryFn: () => getAdmins(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    placeholderData: keepPreviousData,
  });
};

// Create a new admin
export const useAddAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminData) => addAdmin(adminData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

// Delete an admin
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId) => deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
};

// The signed-in admin's password change lives in useProfile.js
// (useChangeProfilePassword), shared with the attendant flow.
