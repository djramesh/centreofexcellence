import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from "../api/auth";
import { getToken, setToken, AUTH_EXPIRED_EVENT } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((res) => setUser(res.user || null))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /* The API client clears the token and fires this the moment the server
     rejects it, so a session that expires mid-visit signs out everywhere at
     once instead of each screen discovering it separately. */
  useEffect(() => {
    const handleExpiry = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiry);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiry);
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    const res = await loginUser(credentials);
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }, []);

  const handleRegister = useCallback(async (payload) => {
    const res = await registerUser(payload);
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // The token is discarded locally regardless, so a failed call is harmless.
    }
    setToken(null);
    setUser(null);
  }, []);

  const handleUpdateProfile = useCallback(async (payload) => {
    const res = await updateProfile(payload);
    if (res.user) setUser(res.user);
    return res;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
