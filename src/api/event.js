import { api } from ".";
import { buildSearchParams } from "./users";

export const fetchEvent = async (eventId) =>
  await api.get(`/events/${eventId}`);

export const fetchEvents = async (params) => {
  const queryString = buildSearchParams(params);
  const url = `/events${queryString ? `?${queryString}` : ""}`;
  return await api.get(url);
};

export const createEvent = async (credentials) =>
  await api.post(`/events`, credentials);

export const updateEvent = async (eventId, data) =>
  await api.put(`/events/${eventId}`, data);

export const deleteEvent = async (eventId) =>
  await api.delete(`/events/${eventId}`);
