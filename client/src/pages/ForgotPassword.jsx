import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong"
      );
      setMessage("");
    }
  }

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1 >Forgot Password?</h1>

        <p>Enter your registered email address.</p>

        {message && <div className="notice">{message}</div>}
        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button>Reset Password</button>

        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}