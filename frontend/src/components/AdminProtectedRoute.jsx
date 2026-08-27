import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  /* Wait for the session check to finish. Without this, a refresh on any admin
     page bounced to the login screen for a moment before the token was
     validated — and admins reported being "logged out at random". */
  if (loading) {
    return (
      <div className="route-fallback" role="status" aria-live="polite">
        <span className="route-spinner" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
