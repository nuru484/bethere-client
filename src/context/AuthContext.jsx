// src/context/AuthContext.jsx
//
// Cookie-only auth: the tokens live in httpOnly cookies the browser sends
// automatically, so the user object is never persisted client-side. On boot
// we ask the server who we are via GET /auth/me; the cookie decides. A 401
// (no/invalid session) leaves us logged out.
import { createContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { getMe, logoutApi } from "@/api/auth";
// Non-sensitive presence flag: tells the axios interceptor whether a session
// believed it was signed in, so its endSession() only hard-redirects sessions
// that actually were (rendering never reads it - ProtectedRoutes gates on
// isLoading/user alone). The server cookie remains the source of truth - this
// is only a hint, always confirmed by getMe(). Shared with the axios
// interceptor via src/lib/auth-flag.js.
import { AUTHED_FLAG } from "@/lib/auth-flag";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Boot hydration: the httpOnly cookie is the only source of truth, so ask
    // the server who we are. On success adopt the returned user; on 401/any
    // failure render unauthenticated. isLoading stays true until this resolves
    // so the app never renders authed on a dead session.
    const initializeAuth = async () => {
      try {
        const response = await getMe();
        const me = response?.data?.user ?? null;
        if (!cancelled) {
          setUser(me);
          if (me) {
            localStorage.setItem(AUTHED_FLAG, "1");
          } else {
            localStorage.removeItem(AUTHED_FLAG);
          }
        }
      } catch {
        // No/invalid session (or network failure): stay logged out.
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem(AUTHED_FLAG);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(AUTHED_FLAG, "1");
  };

  // Merges fresh server-sent user fields (e.g. twoFactorEnabled after a
  // toggle) into the in-memory user.
  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  };

  const logout = () => {
    // Fire-and-forget server-side revocation; the server clears the auth
    // cookies. Local state is cleared regardless: a failed revocation must
    // never keep the user logged in on this device.
    logoutApi().catch(() => {});

    // Everything below is synchronous ON PURPOSE. Deferring the clear() into
    // logoutApi()'s continuation meant that with the API unreachable the axios
    // timeout (3 minutes, see src/api/index.js) could fire long after the user
    // had signed back in - wiping the cache of the CURRENT principal.
    //
    // The React Query cache holds the outgoing principal's data; on a shared
    // device the next login must not inherit it.
    queryClient.clear();

    // Order is load-bearing: removing AUTHED_FLAG BEFORE any query can 401
    // means the interceptor's endSession() sees no flag and skips its hard
    // window.location.assign("/login"). Clearing the cache first also leaves
    // no mounted query to refire against the dying session. Flipping these
    // around would let a refetch of the outgoing principal's data trigger a
    // full-page navigation mid-logout.
    setUser(null);
    localStorage.removeItem(AUTHED_FLAG);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
