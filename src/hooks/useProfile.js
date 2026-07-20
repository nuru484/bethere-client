// src/hooks/useProfile.js
//
// Role-aware profile data layer. The backend keeps two principals: attendants
// live under /users and admins under /admins, with mirrored endpoints and
// identical response envelopes. Components never branch on role for data
// access - they resolve a profile `kind` ("user" | "admin") once and these
// hooks pick the endpoints and cache keys, so an admin editing their own
// profile hits /admins/:id instead of 404ing on /users/:id.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserById,
  updateUserProfile,
  updateUserProfilePicture,
  changePassword,
} from "@/api/users";
import {
  getAdminById,
  updateAdminProfile,
  updateAdminProfilePicture,
  changeAdminPassword,
} from "@/api/admins";

const endpointsByKind = {
  user: {
    get: getUserById,
    update: updateUserProfile,
    updatePicture: updateUserProfilePicture,
    changePassword,
    detailKey: (profileId) => ["user", profileId],
    listKey: ["users"],
  },
  admin: {
    get: getAdminById,
    update: updateAdminProfile,
    updatePicture: updateAdminProfilePicture,
    changePassword: changeAdminPassword,
    detailKey: (profileId) => ["admin", profileId],
    listKey: ["admins"],
  },
};

const forKind = (kind) => endpointsByKind[kind] ?? endpointsByKind.user;

// The admin endpoints only exist for the signed-in admin's own profile;
// everything else (own attendant profile, admin browsing an attendant)
// goes through /users.
export const resolveProfileKind = ({ isOwnProfile, role }) =>
  isOwnProfile && role === "ADMIN" ? "admin" : "user";

export const useGetProfile = (profileId, { kind = "user", ...options } = {}) => {
  const endpoints = forKind(kind);

  return useQuery({
    queryKey: endpoints.detailKey(profileId),
    queryFn: () => endpoints.get(profileId),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: !!profileId,
    ...options,
  });
};

const useInvalidateProfile = (kind) => {
  const queryClient = useQueryClient();
  const endpoints = forKind(kind);

  return (profileId) => {
    queryClient.invalidateQueries({ queryKey: endpoints.detailKey(profileId) });
    queryClient.invalidateQueries({ queryKey: endpoints.listKey });
  };
};

export const useUpdateProfile = (kind) => {
  const endpoints = forKind(kind);
  const invalidateProfile = useInvalidateProfile(kind);

  return useMutation({
    mutationFn: ({ profileId, data }) => endpoints.update(profileId, data),
    onSuccess: (_response, { profileId }) => invalidateProfile(profileId),
  });
};

export const useUpdateProfilePicture = (kind) => {
  const endpoints = forKind(kind);
  const invalidateProfile = useInvalidateProfile(kind);

  return useMutation({
    mutationFn: ({ profileId, formData }) =>
      endpoints.updatePicture(profileId, formData),
    onSuccess: (_response, { profileId }) => invalidateProfile(profileId),
  });
};

export const useChangeProfilePassword = (kind) => {
  const endpoints = forKind(kind);

  return useMutation({
    mutationFn: (data) => endpoints.changePassword(data),
  });
};
