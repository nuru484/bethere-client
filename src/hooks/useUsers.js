// src/hooks/useUsers.js
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getUsers,
  getUserById,
  addUser,
  updateUserProfile,
  deleteUser,
  updateUserProfilePicture,
  changePassword,
} from "@/api/users";

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

// Get single user by ID
export const useGetUser = (userId, options = {}) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: !!userId,
    ...options,
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

// Update user profile
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }) => updateUserProfile(userId, userData),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUserProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, formData }) =>
      updateUserProfilePicture(userId, formData),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }) => changePassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

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
