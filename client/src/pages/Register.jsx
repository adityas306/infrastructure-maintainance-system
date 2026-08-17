import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register({ setUser }) {
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  async function submit(e) {
    e.preventDefault();

    const allowedDomains = ["smslucknow.ac.in","aktu.ac.in","gmail.com","yahoo.com","outlook.com" , "@hotmail.com","@icloud.com",
                            "@live.com","@msn.com","@proton.me","@protonmail.com","@zoho.com","@aol.com","@mail.com",
                            "@gmx.com","@yandex.com","@rediffmail.com","@mail.ru"];
    const emailDomain = form.email.toLowerCase().split("@")[1];
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      setError("Invalid Domain , Please use an allowed email domain.");
      return;
    }
  

    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (e) {
      setError(e.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1>Create account</h1>
        {error && <div className="error">{error}</div>}
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <div className="password-box">
          <input type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
          <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} > {showPassword ? "Hide" : "Show"}</button>
        </div>
        <button>Register</button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
