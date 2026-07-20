// src/context/AuthContext.jsx
//
// Cookie-only auth: the tokens live in httpOnly cookies the browser sends
// automatically, so the user object is never persisted client-side. On boot
// we ask the server who we are via GET /auth/me; the cookie decides. A 401
// (no/invalid session) leaves us logged out.
import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getMe, logoutApi } from "@/api/auth";

const AuthContext = createContext();

// Non-sensitive presence flag: lets us skip the logged-out flash on reload
// without ever storing user fields. The server cookie remains the source of
// truth - this is only a hint, always confirmed by getMe().
const AUTHED_FLAG = "bethere.authed";

export const AuthProvider = ({ children }) => {
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
