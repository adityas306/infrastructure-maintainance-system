import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Register.css";

export default function Register({ setUser }) {
  const [form, setForm] = useState({
    name: "",
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

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    const allowedDomains = [
      "smslucknow.ac.in",
      "aktu.ac.in",
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "icloud.com",
      "live.com",
      "msn.com",
      "proton.me",
      "protonmail.com",
      "zoho.com",
      "aol.com",
      "mail.com",
      "gmx.com",
      "yandex.com",
      "rediffmail.com",
      "mail.ru",
    ];

    const emailDomain = form.email.toLowerCase().split("@")[1];

    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      setError(
        "Invalid email domain. Please use an allowed email address."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/register", form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);

      navigate("/");
    } catch (e) {
      setError(
        e.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">

      <div className="register-bg-circle register-circle-one"></div>
      <div className="register-bg-circle register-circle-two"></div>

      <div className="register-container">

        {/* Branding */}

        <div className="register-brand">

          <div className="register-brand-icon">
            🏗️
          </div>

          <h1>InfraCare</h1>

          <p>
            Smart Infrastructure
            <br />
            Maintenance System
          </p>

          <div className="register-features">

            <div>
              <span>✓</span>
              Manage infrastructure efficiently
            </div>

            <div>
              <span>✓</span>
              Track maintenance requests
            </div>

            <div>
              <span>✓</span>
              Keep assets safe and maintained
            </div>

          </div>

        </div>

        {/* Register Card */}

        <div className="register-card">

          <div className="register-header">
            <h2>Create Account</h2>

            <p>
              Join InfraCare and start managing infrastructure
            </p>
          </div>

          {error && (
            <div className="register-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            {/* Name */}

            <div className="register-input-group">

              <label>Full Name</label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  👤
                </span>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />

              </div>

            </div>

            {/* Email */}

            <div className="register-input-group">

              <label>Email Address</label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  ✉
                </span>

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

            <div className="register-input-group">

              <label>Password</label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  🔒
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="register-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          <div className="register-login">

            <span>Already have an account?</span>

            <Link to="/login">
              Sign in
            </Link>

          </div>

          <div className="register-footer">
            🔐 Secure Infrastructure Management
          </div>

        </div>

      </div>

    </div>
  );
}