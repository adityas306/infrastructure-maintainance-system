
import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

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
import ManageUsers from "./pages/ManageUsers";
import "./nav.css";

function Layout({ user, setUser }) {
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  const isAdmin = user.role === "admin";
  const isUser = user.role === "user";
  const isTech = user.role === "technician";

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark">◆</span>
          InfraCare
        </div>

        <div className="links">
          <NavLink to="/" end className="nav-item">Dashboard</NavLink>
          <NavLink to="/assets" className="nav-item">Assets</NavLink>
          {(isUser || isAdmin) && (
            <NavLink to="/report" className="nav-item">Report Fault</NavLink>
          )}
          <NavLink to="/tickets" className="nav-item">Tickets</NavLink>
          <NavLink to="/map" className="nav-item">Map</NavLink>
          {isAdmin && (
            <NavLink to="/manage-users" className="nav-item">People</NavLink>
          )}
        </div>

        <div className="nav-right">
          {user.organization && (
            <div className="org-pill" title={user.organization.organizationId}>
              <span>🏢</span>
              <span className="org-pill-name">{user.organization.name}</span>
            </div>
          )}

          <button
            className="theme-toggle"
            onClick={() => setDark((v) => !v)}
            title="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>

          <div className="user-box">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span>{user.name}</span>
              <small>{user.role}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets user={user} />} />
          <Route path="/report" element={<ReportFault />} />
          <Route path="/tickets" element={<Tickets user={user} />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/qr/:value" element={<QRAsset />} />
          {isAdmin && (
            <Route path="/manage-users" element={<ManageUsers />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ user, children }) {
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly user={user}>
            <Login role="user" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/login/admin"
        element={
          <PublicOnly user={user}>
            <Login role="admin" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/login/technician"
        element={
          <PublicOnly user={user}>
            <Login role="technician" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/login/user"
        element={
          <PublicOnly user={user}>
            <Login role="user" setUser={setUser} />
          </PublicOnly>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnly user={user}>
            <Register type="user" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/register/organization"
        element={
          <PublicOnly user={user}>
            <Register type="organization" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/register/user"
        element={
          <PublicOnly user={user}>
            <Register type="user" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route
        path="/register/technician"
        element={
          <PublicOnly user={user}>
            <Register type="technician" setUser={setUser} />
          </PublicOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/*"
        element={
          <Protected user={user}>
            <Layout user={user} setUser={setUser} />
          </Protected>
        }
      />
    </Routes>
  );
}
