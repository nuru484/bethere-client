// src/api/users.js
import { api } from ".";

// URL search params helper
export const buildSearchParams = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

// Get all users with pagination and filters
export const getUsers = async (params = {}) => {
  const queryString = buildSearchParams(params);
  const url = `/users${queryString ? `?${queryString}` : ""}`;

  return await api.get(url);
};

// Get single user by ID
export const getUserById = async (userId) => await api.get(`/users/${userId}`);

// Add/Create new user
export const addUser = async (userData) => await api.post("/users", userData);

// Update user profile
export const updateUserProfile = async (userId, userData) =>
  await api.put(`/users/${userId}`, userData);

export const updateUserProfilePicture = async (userId, formData) => {
  return await api.patch(`/users/${userId}/profile-picture`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });
};

export const changePassword = async (data) =>
  await api.patch(`/users/change-password`, data);

// Delete single user
export const deleteUser = async (userId) =>
  await api.delete(`/users/${userId}`);
