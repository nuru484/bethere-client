import { api } from ".";

// Step 1 of enrollment: request a single-use liveness challenge. Takes no body;
// the server replies with the actions to perform and a challengeToken, or 409
// if the user already has a face scan.
export const createEnrollmentChallenge = async () =>
  api.post(`/facescan/challenge`);

// Step 2 of enrollment: upload the captured frames. `formData` is a FormData
// instance (challengeToken + consent + `frames` files); passing it straight
// through lets axios set the multipart boundary itself - do NOT hand-set
// Content-Type here.
export const addFaceScan = async (formData) => api.post(`/facescan`, formData);

// Step-by-step enrollment. Step 1: request a step challenge (no body).
export const createEnrollmentStepChallenge = async () =>
  api.post(`/facescan/step-challenge`);

// Per-action enrollment upload: one dense single-action burst (challengeToken +
// consent + `frames`). The server verifies just this action and replies with
// the next action or, on the last step, the enrolled user. Pass FormData
// straight through so axios keeps the multipart boundary.
export const submitEnrollmentStep = async (formData) =>
  api.post(`/facescan/step`, formData);

export const getUserFaceScan = (userId) => api.get(`/facescan/${userId}`);

export const deleteFaceScan = (userId) => api.delete(`/facescan/${userId}`);
