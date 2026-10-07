import React, { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err.response?.data?.message || "Unable to load dashboard"
        );
      });
  }, []);

  if (error) {
    return (
      <div className="card">
        <h2>Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return <p>Loading dashboard...</p>;
  }

  // USER
  if (stats.role === "user") {
    return (
      <>
        <div className="hero">
          <h1>Welcome 👋</h1>
          <p>Track your infrastructure contributions.</p>
        </div>

        <div className="grid stats">
          <Stat
            label="My Contributions"
            value={stats.contributions}
          />

          <Stat
            label="Open Reports"
            value={stats.openReports}
          />

          <Stat
            label="Resolved Reports"
            value={stats.resolvedReports}
          />
        </div>
      </>
    );
  }

  // TECHNICIAN
  if (stats.role === "technician") {
    return (
      <>
        <div className="hero">
          <h1>Technician Dashboard 🔧</h1>
          <p>Manage your assigned maintenance problems.</p>
        </div>

        <div className="grid stats">
          <Stat
            label="Assigned Problems"
            value={stats.assignedProblems}
          />

          <Stat
            label="Pending Problems"
            value={stats.pendingProblems}
          />

          <Stat
            label="In Progress"
            value={stats.inProgress}
          />

          <Stat
            label="Problems Resolved"
            value={stats.resolvedProblems}
          />
        </div>
      </>
    );
  }

  // ADMIN
  if (stats.role === "admin") {
    return (
      <>
        <div className="hero">
          <h1>Infrastructure Dashboard</h1>
          <p>Monitor assets, faults and maintenance.</p>
        </div>

        <div className="grid stats">
          <Stat label="Total Assets" value={stats.assets} />
          <Stat label="Faulty Assets" value={stats.faultyAssets} />
          <Stat label="Open Tickets" value={stats.open} />
          <Stat
            label="Assigned / In Progress"
            value={stats.assigned}
          />
          <Stat label="Resolved" value={stats.resolved} />
          <Stat label="Technicians" value={stats.technicians} />
        </div>
      </>
    );
  }

  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>Unknown user role.</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}