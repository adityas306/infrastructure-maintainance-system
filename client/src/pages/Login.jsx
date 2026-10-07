
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Login.css";

const ROLE_META = {
  admin: {
    title: "Admin Login",
    subtitle: "Manage your organisation, assets and maintenance team.",
    icon: "🛡️",
    accent: "admin",
    register: "/register/organization",
    registerText: "Create an organisation",
    features: ["Manage admins & technicians", "Assign and monitor faults", "Organisation-level control"]
  },
  technician: {
    title: "Technician Login",
    subtitle: "View assignments, accept work and resolve infrastructure faults.",
    icon: "🔧",
    accent: "technician",
    register: "/register/technician",
    registerText: "Create technician account",
    features: ["Work with multiple organisations", "Accept or refuse assignments", "Update repair status"]
  },
  user: {
    title: "User Login",
    subtitle: "Report infrastructure problems and track your requests.",
    icon: "👤",
    accent: "user",
    register: "/register/user",
    registerText: "Create user account",
    features: ["Report asset faults", "Track ticket progress", "Organisation-secured access"]
  }
};

export default function Login({ role = "user", setUser }) {
  const meta = ROLE_META[role];
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [organizations, setOrganizations] = useState([]);
  const [selectionToken, setSelectionToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await api.post("/auth/login", {
        ...form,
        role
      });

      if (data.needsOrganization) {
        setOrganizations(data.organizations || []);
        setSelectionToken(data.selectionToken || "");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseOrganization(organizationId) {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.post(
        "/auth/select-organization",
        { organizationId },
        { headers: { Authorization: `Bearer ${selectionToken}` } }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "Could not select organisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-page ${meta.accent}`}>
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />

      <div className="auth-card">
        <section className="auth-brand">
          <Link className="auth-logo" to="/login/user">
            <span>◆</span> InfraCare
          </Link>

          <div className="role-icon">{meta.icon}</div>
          <div className="role-label">{role.toUpperCase()}</div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>

          <div className="auth-features">
            {meta.features.map((item) => (
              <div key={item}><b>✓</b>{item}</div>
            ))}
          </div>
        </section>

        <section className="auth-form-panel">
          {!organizations.length ? (
            <>
              <div className="auth-heading">
                <span>Welcome back</span>
                <h2>Sign in to your account</h2>
                <p>Use your {role} credentials to continue.</p>
              </div>

              {error && <div className="auth-error">⚠ {error}</div>}

              <form onSubmit={submit}>
                <label>Email address</label>
                <div className="auth-input">
                  <span>✉</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>

                <label>Password</label>
                <div className="auth-input">
                  <span>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="auth-forgot">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <button className="auth-submit" disabled={loading}>
                  {loading ? "Signing in..." : `Sign in as ${role}`}
                  <span>→</span>
                </button>
              </form>

              <div className="auth-switch">
                {role === "admin" ? (
                  <>Need an organisation? <Link to="/register/organization">Create one</Link></>
                ) : (
                  <>New here? <Link to={meta.register}>{meta.registerText}</Link></>
                )}
              </div>

              <div className="other-logins">
                <span>Login as</span>
                <Link to="/login/admin">Admin</Link>
                <Link to="/login/technician">Technician</Link>
                <Link to="/login/user">User</Link>
              </div>
            </>
          ) : (
            <>
              <div className="auth-heading">
                <span>Multiple organisations found</span>
                <h2>Choose an organisation</h2>
                <p>Your technician account has access to more than one organisation.</p>
              </div>

              {error && <div className="auth-error">⚠ {error}</div>}

              <div className="organization-list">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    className="organization-option"
                    onClick={() => chooseOrganization(org.id)}
                    disabled={loading}
                  >
                    <span>🏢</span>
                    <div>
                      <strong>{org.name}</strong>
                      <small>{org.organizationId}</small>
                    </div>
                    <b>→</b>
                  </button>
                ))}
              </div>

              <button
                className="back-login"
                onClick={() => {
                  setOrganizations([]);
                  setSelectionToken("");
                }}
              >
                ← Back to login
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
