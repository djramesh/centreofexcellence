import { apiClient } from "./client";

export function registerUser({ name, email, password, phone }) {
  return apiClient.post("/api/auth/register", { name, email, password, phone });
}

export function loginUser({ email, password }) {
  return apiClient.post("/api/auth/login", { email, password });
}

export function fetchCurrentUser() {
  return apiClient.get("/api/auth/me");
}

export function updateProfile({ name, phone }) {
  return apiClient.patch("/api/auth/me", { name, phone });
}

export function changePassword({ currentPassword, newPassword }) {
  return apiClient.post("/api/auth/change-password", { currentPassword, newPassword });
}

export function logoutUser() {
  return apiClient.post("/api/auth/logout", {});
}
