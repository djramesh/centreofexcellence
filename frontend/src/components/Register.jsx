import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Common.css";
import "./Login.css";

/** Mirrors the server's rule so the user is told before the round-trip. */
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[a-zA-Z]/.test(p), label: "Contains a letter" },
  { test: (p) => /[0-9]/.test(p), label: "Contains a number" },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));
  const passwordValid = passwordChecks.every((check) => check.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordValid) {
      setError("Please choose a password that meets all the requirements.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await register(form);
      navigate(from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">Join our artisan community marketplace.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {form.password && (
              <ul className="auth-password-rules">
                {passwordChecks.map((check) => (
                  <li key={check.label} className={check.passed ? "rule-ok" : "rule-pending"}>
                    {check.passed ? "✓" : "○"} {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            className="button auth-submit"
            type="submit"
            disabled={submitting || !passwordValid}
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

