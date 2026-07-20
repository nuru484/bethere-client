// src/api/admins.js
//
// Admin staff management (principal split): admins live under /admins,
// while /users manages attendants only.
import { api } from ".";
import { buildSearchParams } from "./users";

// List admins with pagination ({ message, data, meta } envelope)
export const getAdmins = async (params = {}) => {
  const queryString = buildSearchParams(params);
  const url = `/admins${queryString ? `?${queryString}` : ""}`;

  return await api.get(url);
};

// Get single admin by ID ({ message, data } envelope, mirrors /users/:id)
export const getAdminById = async (adminId) =>
  await api.get(`/admins/${adminId}`);

// Create a new admin (same body shape as attendant creation)
export const addAdmin = async (adminData) =>
  await api.post("/admins", adminData);

// Update an admin's profile (body: firstName, lastName, email, phone)
export const updateAdminProfile = async (adminId, adminData) =>
  await api.put(`/admins/${adminId}`, adminData);

// Update an admin's profile picture (multipart field "profilePicture"). The
// FormData goes through untouched so the browser sets the multipart boundary.
export const updateAdminProfilePicture = async (adminId, formData) =>
  await api.patch(`/admins/${adminId}/profile-picture`, formData);

// Delete an admin
export const deleteAdmin = async (adminId) =>
  await api.delete(`/admins/${adminId}`);

// Change the signed-in admin's password
export const changeAdminPassword = async (data) =>
  await api.patch("/admins/change-password", data);
