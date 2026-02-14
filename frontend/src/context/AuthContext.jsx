import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((res) => {
        setUser(res.user || null);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.token) {
      localStorage.setItem("authToken", res.token);
      setUser(res.user);
    }
    return res;
  };

  const handleRegister = async (payload) => {
    const res = await registerUser(payload);
    if (res.token) {
      localStorage.setItem("authToken", res.token);
      setUser(res.user);
    }
    return res;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("authToken");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

