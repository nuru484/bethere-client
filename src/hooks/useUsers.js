// src/hooks/useUsers.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getUsers, addUser, deleteUser } from "@/api/users";

// Get all users with pagination and filters
export const useGetAllUsers = (params = {}) => {
  const queryKey = ["users", params];

  return useQuery({
    queryKey,
    queryFn: () => getUsers(params),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    placeholderData: keepPreviousData,
  });
};

// Create/Add new user
export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => addUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
      queryClient.removeQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useSearchUsers = (searchParams = {}) => {
  const queryKey = ["users", "search", searchParams];

  return useQuery({
    queryKey,
    queryFn: () => getUsers(searchParams),
    staleTime: 1000 * 60 * 3,
    retry: 2,
    placeholderData: keepPreviousData,
    enabled: !!searchParams.search,
  });
};

export const useLazyGetAllUsers = () => {
  const queryClient = useQueryClient();

  return {
    fetch: (params = {}) =>
      queryClient.fetchQuery({
        queryKey: ["users", params],
        queryFn: () => getUsers(params),
      }),
    prefetch: (params = {}) =>
      queryClient.prefetchQuery({
        queryKey: ["users", params],
        queryFn: () => getUsers(params),
      }),
  };
};

export const useLazySearchUsers = () => {
  const queryClient = useQueryClient();

  return {
    fetch: (searchParams = {}) =>
      queryClient.fetchQuery({
        queryKey: ["users", "search", searchParams],
        queryFn: () => getUsers(searchParams),
      }),
  };
};
