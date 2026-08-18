import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const { data } = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(
        data.message || "Password reset instructions have been sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">

      <div className="forgot-bg-circle forgot-circle-one"></div>
      <div className="forgot-bg-circle forgot-circle-two"></div>

      <div className="forgot-container">

        {/* Branding Section */}

        <div className="forgot-brand">

          <div className="forgot-brand-icon">
            🔐
          </div>

          <h1>InfraCare</h1>

          <p>
            Smart Infrastructure
            <br />
            Maintenance System
          </p>

          <div className="forgot-features">

            <div>
              <span>✓</span>
              Secure account recovery
            </div>

            <div>
              <span>✓</span>
              Protect your account
            </div>

            <div>
              <span>✓</span>
              Reliable infrastructure management
            </div>

          </div>

        </div>

        {/* Forgot Password Card */}

        <div className="forgot-card">

          <div className="forgot-header">

            <div className="forgot-icon">
              🔑
            </div>

            <h2>Forgot Password?</h2>

            <p>
              Enter your registered email address and
              we'll help you reset your password.
            </p>

          </div>

          {message && (
            <div className="forgot-success">
              <span>✓</span>
              {message}
            </div>
          )}

          {error && (
            <div className="forgot-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            <div className="forgot-input-group">

              <label>Email Address</label>

              <div className="forgot-input-wrapper">

                <span className="forgot-input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setMessage("");
                  }}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="forgot-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  Send Reset Link
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          <div className="forgot-login">

            <span>Remember your password?</span>

            <Link to="/login">
              Back to Login
            </Link>

          </div>

          <div className="forgot-footer">
            🔐 Secure Infrastructure Management
          </div>

        </div>

      </div>

    </div>
  );
}