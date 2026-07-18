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

// Create a new admin (same body shape as attendant creation)
export const addAdmin = async (adminData) =>
  await api.post("/admins", adminData);

// Delete an admin
export const deleteAdmin = async (adminId) =>
  await api.delete(`/admins/${adminId}`);

// Change the signed-in admin's password
export const changeAdminPassword = async (data) =>
  await api.patch("/admins/change-password", data);
