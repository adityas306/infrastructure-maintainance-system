import React from "react";
import {  useEffect, useState } from "react";
import { BrowserRouter , Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import api from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import ReportFault from "./pages/ReportFault";
import QRAsset from "./pages/QRAsset";
import Tickets from "./pages/Tickets";
import MapPage from "./pages/MapPage";
import ForgotPassword from "./pages/ForgotPassword";
import "./nav.css";
function Layout({ user, setUser }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="nav">

      {/* Logo */}
      <div  className="brand"  onClick={() => navigate("/")}>
        InfraCare
      </div>
      {/* Navigation Links */}
      <div className="links">
        <NavLink  to="/"  end  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"  }>
          Dashboard
        </NavLink>
        <NavLink  to="/assets"  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"  }>
          Assets
        </NavLink>
        <NavLink  to="/report"  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"  }>
          Report Fault
        </NavLink>
        <NavLink  to="/tickets"  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"  }>
          Tickets
        </NavLink>
        <NavLink  to="/map"  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"  }>
          Map
        </NavLink>

        {/* User */}
        <div className="user-box">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="user-info">
            <span>{user?.name}</span>
            <small>{user?.role}</small>
          </div>
        </div>

        {/* Logout */}
        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>

      </div>
    </nav>
  );
}

function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  return (
    <>
      {user && <Layout user={user} setUser={setUser} />}
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/" element={<Protected user={user}><Dashboard /></Protected>} />
          <Route path="/assets" element={<Protected user={user}><Assets user={user} /></Protected>} />
          <Route path="/report" element={<Protected user={user}><ReportFault /></Protected>} />
          <Route path="/qr/:value" element={<Protected user={user}><QRAsset /></Protected>} />
          <Route path="/tickets" element={<Protected user={user}><Tickets user={user} /></Protected>} />
          <Route path="/map" element={<Protected user={user}><MapPage /></Protected>} />
          <Route path="/forgot-password" element={<ForgotPassword />}/></Routes>
      </main>
    </>
  );
}
