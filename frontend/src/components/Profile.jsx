import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/auth";
import "./Common.css";
import "./Login.css";

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();

  const [tab, setTab] = useState("details");
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!user) return null;

  const startEditing = () => {
    setProfileForm({ name: user.name || "", phone: user.phone || "" });
    setEditing(true);
    setFeedback({ type: "", message: "" });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await updateProfile(profileForm);
      setEditing(false);
      setFeedback({ type: "success", message: "Your details were saved." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: "error", message: "The two new passwords do not match." });
      return;
    }
    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setFeedback({ type: "success", message: "Your password has been updated." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h2 className="auth-title">My Account</h2>
        <p className="auth-subtitle">Manage your profile, password and orders.</p>

        <div className="profile-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "details"}
            className={`profile-tab${tab === "details" ? " profile-tab-active" : ""}`}
            onClick={() => { setTab("details"); setFeedback({ type: "", message: "" }); }}
          >
            Details
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "password"}
            className={`profile-tab${tab === "password" ? " profile-tab-active" : ""}`}
            onClick={() => { setTab("password"); setFeedback({ type: "", message: "" }); }}
          >
            Password
          </button>
        </div>

        {feedback.message && (
          <div className={feedback.type === "error" ? "auth-error" : "auth-success"}>
            {feedback.message}
          </div>
        )}

        {tab === "details" ? (
          editing ? (
            <form className="auth-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-phone">Phone</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              {/* Email is the account identifier, so it is not editable here. */}
              <p className="profile-hint">
                Need to change your email address? Contact us and we will update it for you.
              </p>
              <div className="profile-actions">
                <button className="button auth-submit" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="button-1 profile-cancel"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-info">
                <div className="profile-row">
                  <span className="profile-label">Name</span>
                  <span className="profile-value">{user.name}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Phone</span>
                  <span className="profile-value">{user.phone || "—"}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Account type</span>
                  <span className="profile-value">
                    {user.role === "admin" ? "Admin" : "Customer"}
                  </span>
                </div>
              </div>

              <div className="profile-actions">
                <button type="button" className="button auth-submit" onClick={startEditing}>
                  Edit details
                </button>
                <Link to="/orders" className="button-1 profile-cancel">
                  My orders
                </Link>
              </div>
            </>
          )
        ) : (
          <form className="auth-form" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <small className="profile-hint">
                At least 8 characters, including a letter and a number.
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                required
              />
            </div>
            <button className="button auth-submit" type="submit" disabled={saving}>
              {saving ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <button className="button-1 profile-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default Profile;
