// src/hooks/useUsers.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getUsers, addUser, deleteUser } from "@/api/users";
import { queryKeys } from "@/api/query-keys";

// Get all users with pagination and filters. Focus refetching is on (against
// the global default): the directory changes from other admin sessions -
// enrollments, deletions, face-scan state - so a returning tab should not sit
// on a list that is up to the 5-minute staleTime out of date.
export const useGetAllUsers = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => getUsers(params),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
};

// Create/Add new user
export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => addUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

// Profile read/update hooks (own profile + admin-viewing-attendant) live in
// useProfile.js, which routes between the /users and /admins principals.

// Delete single user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: (data, userId) => {
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useSearchUsers = (searchParams = {}) => {
  return useQuery({
    queryKey: queryKeys.users.search(searchParams),
    queryFn: () => getUsers(searchParams),
    // Deliberate: search results churn faster than the paged directory, so
    // they go stale sooner than the global 5 minutes.
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    enabled: !!searchParams.search,
  });
};
