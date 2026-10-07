
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Register.css";

const TYPE_META = {
  organization: {
    icon: "🏢",
    label: "Organisation",
    title: "Create your organisation",
    subtitle: "Set up your organisation and create its first administrator.",
    login: "/login/admin"
  },
  user: {
    icon: "👤",
    label: "User",
    title: "Create user account",
    subtitle: "Join your organisation and start reporting infrastructure issues.",
    login: "/login/user"
  },
  technician: {
    icon: "🔧",
    label: "Technician",
    title: "Create technician account",
    subtitle: "Create one technician account that can work across multiple organisations.",
    login: "/login/technician"
  }
};

export default function Register({ type = "user", setUser }) {
  const meta = TYPE_META[type];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: "",
    organizationId: "",
    name: "",
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (type === "organization" && (!form.organizationName || !form.organizationId)) {
      setError("Organisation name and unique organisation ID are required.");
      return;
    }

    if (type === "user" && !form.organizationId) {
      setError("Enter your organisation ID.");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        type === "organization"
          ? "/auth/register-organization"
          : type === "technician"
          ? "/auth/register-technician"
          : "/auth/register-user";

      const { data } = await api.post(endpoint, {
        ...form,
        organizationId: form.organizationId.trim().toUpperCase()
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  function update(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
    setError("");
  }

  return (
    <div className={`auth-page register-auth ${type}`}>
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />

      <div className="auth-card register-card-layout">
        <section className="auth-brand">
          <Link className="auth-logo" to="/login/user">
            <span>◆</span> InfraCare
          </Link>

          <div className="role-icon">{meta.icon}</div>
          <div className="role-label">CREATE {meta.label.toUpperCase()}</div>
          <h1>Build a safer infrastructure.</h1>
          <p>{meta.subtitle}</p>

          <div className="auth-features">
            <div><b>✓</b>Secure role-based access</div>
            <div><b>✓</b>Organisation-level data isolation</div>
            <div><b>✓</b>Real-time maintenance workflow</div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-heading">
            <span>{meta.label} registration</span>
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={submit}>
            {type === "organization" && (
              <>
                <label>Organisation name</label>
                <div className="auth-input">
                  <span>🏢</span>
                  <input
                    placeholder="e.g. ABC College"
                    value={form.organizationName}
                    onChange={(e) => update("organizationName", e.target.value)}
                  />
                </div>

                <label>Unique organisation ID</label>
                <div className="auth-input">
                  <span>#</span>
                  <input
                    placeholder="e.g. ABC-COLLEGE-01"
                    value={form.organizationId}
                    onChange={(e) => update("organizationId", e.target.value.toUpperCase())}
                  />
                </div>
                <small className="field-help">This ID will be used by users to join your organisation.</small>
              </>
            )}

            {type === "user" && (
              <>
                <label>Organisation ID</label>
                <div className="auth-input">
                  <span>🏢</span>
                  <input
                    placeholder="e.g. ABC-COLLEGE-01"
                    value={form.organizationId}
                    onChange={(e) => update("organizationId", e.target.value.toUpperCase())}
                  />
                </div>
              </>
            )}

            <label>Full name</label>
            <div className="auth-input">
              <span>👤</span>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                autoComplete="name"
              />
            </div>

            <label>Email address</label>
            <div className="auth-input">
              <span>✉</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>

            <label>Password</label>
            <div className="auth-input">
              <span>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="auth-submit" disabled={loading}>
              {loading ? "Creating account..." : `Create ${meta.label.toLowerCase()} account`}
              <span>→</span>
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to={meta.login}>Sign in</Link>
          </div>

          <div className="other-logins">
            <span>Account type</span>
            <Link to="/register/organization">Organisation</Link>
            <Link to="/register/technician">Technician</Link>
            <Link to="/register/user">User</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
