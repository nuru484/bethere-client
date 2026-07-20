import { api } from ".";
import { buildSearchParams } from "./users";

// Events are written as multipart/form-data so the optional cover image can
// travel with the rest of the payload. Wire contract:
// - every scalar is appended as a string (booleans as "true"/"false",
//   numbers via String(), explicit null as "")
// - nested objects (location) are appended JSON-encoded under their key
// - coverImage: omitted = leave unchanged, "" = remove, File = replace
const buildEventFormData = (eventData = {}) => {
  const formData = new FormData();

  Object.entries(eventData).forEach(([key, value]) => {
    if (value === undefined) return;

    if (key === "coverImage") {
      if (value instanceof File || value === "") {
        formData.append(key, value);
      }
      return;
    }

    if (value === null) {
      formData.append(key, "");
      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

// Let the browser set the multipart boundary instead of the instance-level
// application/json default.
const multipartConfig = { headers: { "Content-Type": undefined } };

export const fetchEvent = async (eventId) =>
  await api.get(`/events/${eventId}`);

export const fetchEvents = async (params) => {
  const queryString = buildSearchParams(params);
  const url = `/events${queryString ? `?${queryString}` : ""}`;
  return await api.get(url);
};

export const createEvent = async (eventData) =>
  await api.post(`/events`, buildEventFormData(eventData), multipartConfig);

export const updateEvent = async (eventId, eventData) =>
  await api.put(
    `/events/${eventId}`,
    buildEventFormData(eventData),
    multipartConfig
  );

export const deleteEvent = async (eventId) =>
  await api.delete(`/events/${eventId}`);

// Admin venue display: fetch a batch of upcoming rotating venue codes plus the
// rotation period (periodMs). Each code is valid for [validFrom, validTo).
export const getVenueCodes = async (eventId) =>
  await api.get(`/events/${eventId}/venue-codes`);
