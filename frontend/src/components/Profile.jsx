import React from "react";
import { useAuth } from "../context/AuthContext";
import "./Common.css";
import "./Login.css";

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">My Account</h2>
        <p className="auth-subtitle">Manage your profile and orders.</p>
        <div className="profile-info">
          <div className="profile-row">
            <span className="profile-label">Name</span>
            <span className="profile-value">{user.name}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user.email}</span>
          </div>
          {user.phone && (
            <div className="profile-row">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{user.phone}</span>
            </div>
          )}
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="profile-value">
              {user.role === "admin" ? "Admin" : "Customer"}
            </span>
          </div>
        </div>
        <button className="button auth-submit" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;

