import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";

export default function Login({ setUser }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  }

  async function submit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/login", form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* Background decoration */}
      <div className="login-bg-circle circle-one"></div>
      <div className="login-bg-circle circle-two"></div>

      <div className="login-container">

        {/* Left branding section */}
        <div className="login-brand">

          <div className="brand-icon">
            🏗️
          </div>

          <h1>InfraCare</h1>

          <p className="brand-tagline">
            Smart Infrastructure
            <br />
            Maintenance System
          </p>

          <div className="brand-features">
            <div>
              <span>✓</span>
              Monitor infrastructure
            </div>

            <div>
              <span>✓</span>
              Manage maintenance
            </div>

            <div>
              <span>✓</span>
              Track issues efficiently
            </div>
          </div>

        </div>

        {/* Login card */}
        <div className="login-card">

          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access your InfraCare dashboard</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            {/* Email */}
            <div className="input-group">
              <label>Email Address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <div className="register-section">
            <span>Don't have an account?</span>

            <Link to="/register">
              Create an account
            </Link>
          </div>

          <div className="login-footer">
            <span>🔐 Secure Infrastructure Management</span>
          </div>

        </div>
      </div>
    </div>
  );
}