import React from "react";
import {  useEffect, useState } from "react";
import { BrowserRouter , Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
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

function Layout({ user, setUser }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  }

  return (
    <div>
      <nav className="nav">
        <div className="brand">InfraCare</div>
        <div className="links">
          <Link to="/">Dashboard</Link>
          <Link to="/assets">Assets</Link>
          <Link to="/report">Report Fault</Link>
          <Link to="/tickets">Tickets</Link>
          <Link to="/map">Map</Link>
          <span className="user">{user.name} ({user.role})</span>
          <button className="danger small" onClick={logout}>Logout</button>
        </div>
      </nav>
    </div>
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
