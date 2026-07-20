// src/api/auth.js
//
// Cookie-only auth: the server sets/clears httpOnly cookies; response
// bodies carry only the safe user (and flow flags), never a token.
import { api } from ".";

// Responds { message, data: { user } } (cookies set), or
// { message, data: { twoFactorRequired: true, channel } } when a second
// factor is needed (a short-lived pending cookie was set).
export const login = async (credentials) =>
  await api.post("/auth/login", credentials);

// Second login step when 2FA is on. Responds { message, data: { user } }
// with auth cookies set. A 401 with code "2FA_PENDING_EXPIRED" means the
// pending cookie ran out - restart from the password step.
export const verify2fa = async ({ code }) =>
  await api.post("/auth/login/2fa", { code });

// Passwordless OTP login, step 1 (attendants). Always succeeds;
// data.channel is "SMS", "EMAIL", or null (enumeration-safe).
export const otpRequest = async ({ identifier }) =>
  await api.post("/auth/otp/request", { identifier });

// Passwordless OTP login, step 2. Responds { message, data: { user } }
// with auth cookies set.
export const otpVerify = async ({ identifier, code }) =>
  await api.post("/auth/otp/verify", { identifier, code });

// Hydrates the signed-in principal from the httpOnly session cookie.
// Responds { message, data: { user } }; a 401 means no/invalid session.
export const getMe = async () => await api.get("/auth/me");

// Portfolio demo sign-in: the server mints a demo session for the given role
// and sets the auth cookies. role is "ADMIN" or "USER". Responds
// { message, data: { user } }, or 403 when demo login is disabled server-side.
export const demoLogin = async (role) =>
  await api.post("/auth/demo-login", { role });

// Revokes the session server-side and clears the cookies. Cookie-based:
// no header or body needed.
export const logoutApi = async () => await api.post("/auth/logout", {});

// 2FA management for the signed-in principal: challenge sends a code,
// enable/disable prove possession with it. Responses carry { data: { user } }.
export const twoFactorChallenge = async () =>
  await api.post("/auth/2fa/challenge", {});

export const twoFactorEnable = async ({ code }) =>
  await api.post("/auth/2fa/enable", { code });

export const twoFactorDisable = async ({ code }) =>
  await api.post("/auth/2fa/disable", { code });
