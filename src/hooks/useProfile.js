// src/hooks/useProfile.js
//
// Role-aware profile data layer. The backend keeps two principals: attendants
// live under /users and admins under /admins, with mirrored endpoints and
// identical response envelopes. Components never branch on role for data
// access - they resolve a profile `kind` ("user" | "admin") once and these
// hooks pick the endpoints and cache keys, so an admin editing their own
// profile hits /admins/:id instead of 404ing on /users/:id.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
import { queryKeys } from "@/api/query-keys";

const endpointsByKind = {
  user: {
    get: getUserById,
    update: updateUserProfile,
    updatePicture: updateUserProfilePicture,
    changePassword,
    detailKey: queryKeys.users.detail,
    listKey: queryKeys.users.all,
  },
  admin: {
    get: getAdminById,
    update: updateAdminProfile,
    updatePicture: updateAdminProfilePicture,
    changePassword: changeAdminPassword,
    detailKey: queryKeys.admins.detail,
    listKey: queryKeys.admins.all,
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
    // Focus refetch on (against the global default): a profile can be edited
    // from another session, and the profile page is also where face-scan
    // enrollment state is read back after an enrolment done elsewhere.
    refetchOnWindowFocus: true,
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

// When the edited profile is the signed-in principal's own, merge the
// server's fresh fields into AuthContext too - the navbar renders name and
// avatar from the context user, and cache invalidation alone left it stale
// until a full reload re-ran the boot getMe(). Ids alone are not enough:
// admins and attendants live in separate tables, so an admin's numeric id
// can collide with an attendant's - the kind must match as well.
const useSyncOwnProfile = (kind) => {
  const { user: authUser, updateUser } = useAuth();

  return (profileId, response) => {
    const isOwn =
      authUser &&
      String(authUser.id) === String(profileId) &&
      (authUser.role === "ADMIN") === (kind === "admin");

    // Response envelope: { message, data: <safe user> }
    if (isOwn && response?.data) {
      updateUser(response.data);
    }
  };
};

export const useUpdateProfile = (kind) => {
  const endpoints = forKind(kind);
  const invalidateProfile = useInvalidateProfile(kind);
  const syncOwnProfile = useSyncOwnProfile(kind);

  return useMutation({
    mutationFn: ({ profileId, data }) => endpoints.update(profileId, data),
    onSuccess: (response, { profileId }) => {
      invalidateProfile(profileId);
      syncOwnProfile(profileId, response);
    },
  });
};

export const useUpdateProfilePicture = (kind) => {
  const endpoints = forKind(kind);
  const invalidateProfile = useInvalidateProfile(kind);
  const syncOwnProfile = useSyncOwnProfile(kind);

  return useMutation({
    mutationFn: ({ profileId, formData }) =>
      endpoints.updatePicture(profileId, formData),
    onSuccess: (response, { profileId }) => {
      invalidateProfile(profileId);
      syncOwnProfile(profileId, response);
    },
  });
};

export const useChangeProfilePassword = (kind) => {
  const endpoints = forKind(kind);

  return useMutation({
    mutationFn: (data) => endpoints.changePassword(data),
  });
};
