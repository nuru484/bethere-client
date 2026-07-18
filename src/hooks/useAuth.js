// src/hooks/useAuth.js
import { useMutation } from "@tanstack/react-query";
import {
  login,
  otpRequest,
  otpVerify,
  twoFactorChallenge,
  twoFactorDisable,
  twoFactorEnable,
  verify2fa,
} from "@/api/auth";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "@/context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useLogin = () => {
  const mutation = useMutation({
    mutationFn: login,
  });

  return mutation;
};

export const useVerify2fa = () =>
  useMutation({
    mutationFn: verify2fa,
  });

export const useOtpRequest = () =>
  useMutation({
    mutationFn: otpRequest,
  });

export const useOtpVerify = () =>
  useMutation({
    mutationFn: otpVerify,
  });

// 2FA management for the signed-in principal (profile security page).
export const useTwoFactorChallenge = () =>
  useMutation({
    mutationFn: twoFactorChallenge,
  });

export const useTwoFactorToggle = () => {
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: ({ enable, code }) =>
      enable ? twoFactorEnable({ code }) : twoFactorDisable({ code }),
    onSuccess: (response) => {
      // Response envelope: { message, data: { user } }
      if (response?.data?.user) {
        updateUser(response.data.user);
      }
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const logout = () => {
    contextLogout();
    navigate("/login");
  };

  return logout;
};
