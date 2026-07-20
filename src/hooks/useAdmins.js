// src/hooks/useAdmins.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getAdmins, addAdmin, deleteAdmin } from "@/api/admins";
import { queryKeys } from "@/api/query-keys";

// Get all admins with pagination
export const useGetAllAdmins = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.admins.list(params),
    queryFn: () => getAdmins(params),
    // Focus refetch on (against the global default): admin staff are added and
    // removed by other super-admins, and a stale roster here is a permissions
    // question, not a cosmetic one.
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
};

// Create a new admin
export const useAddAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminData) => addAdmin(adminData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.all });
    },
  });
};

// Delete an admin
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId) => deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.all });
    },
  });
};

// The signed-in admin's password change lives in useProfile.js
// (useChangeProfilePassword), shared with the attendant flow.
