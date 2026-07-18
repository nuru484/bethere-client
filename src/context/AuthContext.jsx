// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import encryptStorage from "@/lib/encryptedStorage";
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
        const accessToken = encryptStorage.getItem("accessToken");

        if (savedUser && accessToken) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);

        localStorage.removeItem("user");
        encryptStorage.removeItem("accessToken");
        encryptStorage.removeItem("refreshToken");
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

  const logout = () => {
    // Fire-and-forget server-side revocation of the refresh token. Local
    // state is cleared regardless: a failed revocation must never keep the
    // user logged in on this device.
    const refreshToken = encryptStorage.getItem("refreshToken");
    if (refreshToken) {
      logoutApi(refreshToken).catch(() => {});
    }

    encryptStorage.removeItem("accessToken");
    encryptStorage.removeItem("refreshToken");
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
