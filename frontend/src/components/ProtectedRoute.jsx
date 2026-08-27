import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-fallback" role="status" aria-live="polite">
        <span className="route-spinner" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    /* Carry where they were going so Login can send them back there. Someone
       deep-linked to /orders/42 previously landed on the home page after
       signing in and had to navigate all over again. */
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
