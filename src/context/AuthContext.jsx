// src/context/AuthContext.jsx
//
// Cookie-only auth: the tokens live in httpOnly cookies the browser sends
// automatically, so "authenticated" here simply means "we have a persisted
// user". A 401 that fails refresh clears that user (see src/api/index.js).
import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { logoutApi } from "@/api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        setIsLoading(true);
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }
  }, [user, isLoading]);

  const login = (userData) => {
    setUser(userData);
  };

  // Merges fresh server-sent user fields (e.g. twoFactorEnabled after a
  // toggle) into the persisted user.
  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : userData));
  };

  const logout = () => {
    // Fire-and-forget server-side revocation; the server clears the auth
    // cookies. Local state is cleared regardless: a failed revocation must
    // never keep the user logged in on this device.
    logoutApi().catch(() => {});

    setUser(null);
    localStorage.removeItem("user");
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
