import axios from "axios";
import { api } from ".";

const serverURL = import.meta.env.VITE_SERVER_URL;

// Responds { message, data: { accessToken, refreshToken, user } }
export const login = async (credentials) =>
  await api.post("/auth/login", credentials);

// Revokes the refresh token server-side. Uses a bare axios call (not the
// `api` instance) because the request interceptor would overwrite the
// Authorization header with the ACCESS token, and this endpoint expects
// the REFRESH token as the Bearer credential.
export const logoutApi = async (refreshToken) =>
  await axios.post(
    `${serverURL}/api/v1/auth/logout`,
    {},
    {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );
