import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";


export default function Login({ setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1>InfraCare</h1>
        <p>Infrastructure maintenance system</p>
        {error && <div className="error">{error}</div>}
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
        <div className="password-box">
          <input type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
          <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} > {showPassword ? "Hide" : "Show"}</button>
        </div>
        <button>Login</button>
        <Link to="/forgot-password">Forgot Password?</Link>
        <p>New user? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
