import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setError("");

      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>

            <button
              className="retry-btn"
              onClick={() => loadDashboard(true)}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <DashboardHeader
        role={stats.role}
        refreshing={refreshing}
        onRefresh={() => loadDashboard(true)}
      />

      {stats.role === "user" && (
        <UserDashboard stats={stats} />
      )}

      {stats.role === "technician" && (
        <TechnicianDashboard stats={stats} />
      )}

      {stats.role === "admin" && (
        <AdminDashboard stats={stats} />
      )}

      {!["user", "technician", "admin"].includes(stats.role) && (
        <div className="dashboard-error">
          <div className="error-icon">!</div>

          <div>
            <h3>Unknown user role</h3>
            <p>Please contact your administrator.</p>
          </div>
        </div>
      )}
    </div>
  );
}


/* =====================================================
   HEADER
===================================================== */

function DashboardHeader({
  role,
  refreshing,
  onRefresh,
}) {
  const roleInfo = {
    admin: {
      title: "Infrastructure Dashboard",
      subtitle:
        "Monitor assets, faults and maintenance activity.",
      icon: "🏢",
    },

    technician: {
      title: "Technician Dashboard",
      subtitle:
        "Manage and resolve your assigned maintenance problems.",
      icon: "🔧",
    },

    user: {
      title: "Welcome back",
      subtitle:
        "Track your infrastructure contributions and reports.",
      icon: "👋",
    },
  };

  const current =
    roleInfo[role] || roleInfo.user;

  return (
    <div className="dashboard-header">

      <div className="dashboard-title-area">

        <div className="dashboard-badge">
          <span></span>
          {role}
        </div>

        <h1>
          {current.title} {current.icon}
        </h1>

        <p>{current.subtitle}</p>
      </div>

      <div className="dashboard-header-actions">

        <div className="system-status">
          <span className="status-dot"></span>

          <div>
            <strong>System Online</strong>
            <small>InfraCare</small>
          </div>
        </div>

        <button
          className={`refresh-btn ${
            refreshing ? "refreshing" : ""
          }`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh dashboard"
        >
          <span>↻</span>
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>
    </div>
  );
}


/* =====================================================
   USER DASHBOARD
===================================================== */

function UserDashboard({ stats }) {
  const total =
    Number(stats.openReports || 0) +
    Number(stats.resolvedReports || 0);

  const resolvedPercentage =
    total > 0
      ? Math.round(
          (Number(stats.resolvedReports || 0) /
            total) *
            100
        )
      : 0;

  return (
    <>
      <div className="stats-grid user-grid">

        <InteractiveStat
          icon="📋"
          label="My Contributions"
          value={stats.contributions}
          description="Total reports submitted"
          accent="blue"
        />

        <InteractiveStat
          icon="⚠️"
          label="Open Reports"
          value={stats.openReports}
          description="Waiting for resolution"
          accent="orange"
        />

        <InteractiveStat
          icon="✅"
          label="Resolved Reports"
          value={stats.resolvedReports}
          description="Successfully resolved"
          accent="green"
        />

      </div>

      <div className="dashboard-lower-grid">

        <ProgressCard
          title="Resolution Progress"
          value={resolvedPercentage}
          description="Percentage of your reports resolved"
        />

        <InfoCard
          icon="💡"
          title="Keep contributing"
          text="Your reports help the organization identify and resolve infrastructure problems faster."
        />

      </div>
    </>
  );
}


/* =====================================================
   TECHNICIAN DASHBOARD
===================================================== */

function TechnicianDashboard({ stats }) {
  const total =
    Number(stats.assignedProblems || 0);

  const resolved =
    Number(stats.resolvedProblems || 0);

  const progress =
    total > 0
      ? Math.round(
          (resolved / total) * 100
        )
      : 0;

  return (
    <>
      <div className="stats-grid technician-grid">

        <InteractiveStat
          icon="📌"
          label="Assigned Problems"
          value={stats.assignedProblems}
          description="Problems assigned to you"
          accent="blue"
        />

        <InteractiveStat
          icon="⏳"
          label="Pending Problems"
          value={stats.pendingProblems}
          description="Waiting for action"
          accent="orange"
        />

        <InteractiveStat
          icon="🔧"
          label="In Progress"
          value={stats.inProgress}
          description="Currently being handled"
          accent="purple"
        />

        <InteractiveStat
          icon="✅"
          label="Problems Resolved"
          value={stats.resolvedProblems}
          description="Successfully completed"
          accent="green"
        />

      </div>

      <div className="dashboard-lower-grid">

        <ProgressCard
          title="Resolution Progress"
          value={progress}
          description="Your overall maintenance completion"
        />

        <InfoCard
          icon="🔧"
          title="Maintenance Focus"
          text="Prioritize pending problems and keep assigned infrastructure issues moving toward resolution."
        />

      </div>
    </>
  );
}


/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({ stats }) {
  const [showOverview, setShowOverview] =
    useState(false);

  const activeTickets =
    Number(stats.open || 0) +
    Number(stats.assigned || 0) +
    Number(stats.inProgress || 0);

  const resolvedTickets =
    Number(stats.resolved || 0) +
    Number(stats.closed || 0);

  const totalTickets =
    activeTickets + resolvedTickets;

  const resolvedPercentage =
    totalTickets > 0
      ? Math.round(
          (resolvedTickets / totalTickets) * 100
        )
      : 0;

  const faultyPercentage =
    Number(stats.assets || 0) > 0
      ? Math.round(
          (Number(stats.faultyAssets || 0) /
            Number(stats.assets || 0)) *
            100
        )
      : 0;

  return (
    <>
      {/* =================================================
          MAIN KPI CARDS
      ================================================= */}

      <div className="stats-grid admin-grid">

        <InteractiveStat
          icon="🏢"
          label="Total Assets"
          value={stats.assets}
          description="Registered infrastructure"
          accent="blue"
        />

        <InteractiveStat
          icon="⚠️"
          label="Faulty Assets"
          value={stats.faultyAssets}
          description="Requires attention"
          accent="red"
          danger
        />

        <InteractiveStat
          icon="🎫"
          label="Open Tickets"
          value={stats.open}
          description="Awaiting resolution"
          accent="orange"
        />

        <InteractiveStat
          icon="🔧"
          label="Assigned / In Progress"
          value={
            Number(stats.assigned || 0) +
            Number(stats.inProgress || 0)
          }
          description="Currently being handled"
          accent="purple"
        />

        <InteractiveStat
          icon="✅"
          label="Resolved"
          value={
            Number(stats.resolved || 0) +
            Number(stats.closed || 0)
          }
          description="Completed tickets"
          accent="green"
        />

        <InteractiveStat
          icon="👨‍🔧"
          label="Technicians"
          value={stats.technicians}
          description="Maintenance staff"
          accent="cyan"
        />

      </div>


      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="dashboard-lower-grid">

        <ProgressCard
          title="Ticket Resolution"
          value={resolvedPercentage}
          description="Overall ticket resolution rate"
        />

        <ProgressCard
          title="Faulty Asset Ratio"
          value={faultyPercentage}
          description="Percentage of assets currently faulty"
          danger
        />

      </div>


      {/* =================================================
          ASSET HEALTH
      ================================================= */}

      <section className="dashboard-section">

        <SectionTitle
          title="Asset Health"
          subtitle="Current condition of infrastructure assets"
        />

        <div className="health-grid">

          <HealthCard
            icon="🟢"
            label="Working"
            value={stats.workingAssets}
            total={stats.assets}
            accent="green"
          />

          <HealthCard
            icon="🔴"
            label="Fault"
            value={stats.faultyAssets}
            total={stats.assets}
            accent="red"
          />

          <HealthCard
            icon="🟡"
            label="Maintenance"
            value={stats.maintenanceAssets}
            total={stats.assets}
            accent="orange"
          />

        </div>

      </section>


      {/* =================================================
          TICKET OVERVIEW
      ================================================= */}

      <section className="dashboard-section">

        <SectionTitle
          title="Ticket Overview"
          subtitle="Current maintenance workflow"
        />

        <div className="ticket-status-grid">

          <StatusMiniCard
            label="Open"
            value={stats.open}
            icon="📥"
            accent="orange"
          />

          <StatusMiniCard
            label="Assigned"
            value={stats.assigned}
            icon="📌"
            accent="blue"
          />

          <StatusMiniCard
            label="In Progress"
            value={stats.inProgress}
            icon="🔧"
            accent="purple"
          />

          <StatusMiniCard
            label="Resolved"
            value={stats.resolved}
            icon="✅"
            accent="green"
          />

          <StatusMiniCard
            label="Closed"
            value={stats.closed}
            icon="✔️"
            accent="cyan"
          />

        </div>

      </section>


      {/* =================================================
          PRIORITY + SLA
      ================================================= */}

      <div className="dashboard-two-column">

        <section className="dashboard-panel">

          <SectionTitle
            title="Priority Issues"
            subtitle="High priority active problems"
          />

          {stats.priorityIssues?.length > 0 ? (
            <div className="priority-list">

              {stats.priorityIssues.map(
                (ticket) => (
                  <PriorityTicket
                    key={ticket._id}
                    ticket={ticket}
                  />
                )
              )}

            </div>
          ) : (
            <EmptyState
              icon="🎉"
              text="No high priority issues."
            />
          )}

        </section>


        <section className="dashboard-panel">

          <SectionTitle
            title="SLA Monitoring"
            subtitle="Current service-level status"
          />

          <div className="sla-grid">

            <SLACard
              label="Overdue"
              value={stats.sla?.overdue}
              icon="🔴"
              accent="red"
            />

            <SLACard
              label="Due Soon"
              value={stats.sla?.dueSoon}
              icon="🟡"
              accent="orange"
            />

            <SLACard
              label="On Track"
              value={stats.sla?.onTrack}
              icon="🟢"
              accent="green"
            />

          </div>

        </section>

      </div>


      {/* =================================================
          RECENT ACTIVITY
      ================================================= */}

      <div className="dashboard-two-column">

        <section className="dashboard-panel">

          <SectionTitle
            title="Recent Tickets"
            subtitle="Latest reported maintenance issues"
          />

          {stats.recentTickets?.length > 0 ? (
            <div className="recent-list">

              {stats.recentTickets.map(
                (ticket) => (
                  <RecentTicket
                    key={ticket._id}
                    ticket={ticket}
                  />
                )
              )}

            </div>
          ) : (
            <EmptyState
              icon="📭"
              text="No tickets found."
            />
          )}

        </section>


        <section className="dashboard-panel">

          <SectionTitle
            title="Recent Assets"
            subtitle="Recently registered infrastructure"
          />

          {stats.recentAssets?.length > 0 ? (
            <div className="recent-list">

              {stats.recentAssets.map(
                (asset) => (
                  <RecentAsset
                    key={asset._id}
                    asset={asset}
                  />
                )
              )}

            </div>
          ) : (
            <EmptyState
              icon="🏢"
              text="No assets found."
            />
          )}

        </section>

      </div>


      {/* =================================================
          TECHNICIAN WORKLOAD
      ================================================= */}

      <section className="dashboard-section">

        <SectionTitle
          title="Technician Workload"
          subtitle="Active tickets assigned to technicians"
        />

        {stats.technicianWorkload?.length > 0 ? (
          <div className="workload-list">

            {stats.technicianWorkload.map(
              (tech) => (
                <TechnicianWorkload
                  key={tech.technicianId}
                  technician={tech}
                />
              )
            )}

          </div>
        ) : (
          <EmptyState
            icon="👨‍🔧"
            text="No active technician assignments."
          />
        )}

      </section>


      {/* =================================================
          INFO CARDS
      ================================================= */}

      <div className="dashboard-info-row">

        <InfoCard
          icon="📊"
          title="Infrastructure Overview"
          text="Monitor assets, tickets and maintenance activity from one centralized dashboard."
          clickable
          onClick={() =>
            setShowOverview(true)
          }
        />

        <InfoCard
          icon="👨‍🔧"
          title="Technician Management"
          text="Keep track of assigned work and ensure maintenance problems are resolved on time."
        />

      </div>


      {/* =================================================
          INFRASTRUCTURE MODAL
      ================================================= */}

      {showOverview && (
        <InfrastructureModal
          stats={stats}
          onClose={() =>
            setShowOverview(false)
          }
        />
      )}

    </>
  );
}


/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  title,
  subtitle,
}) {
  return (
    <div className="dashboard-section-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}


/* =====================================================
   HEALTH CARD
===================================================== */

function HealthCard({
  icon,
  label,
  value,
  total,
  accent,
}) {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);

  const percentage =
    safeTotal > 0
      ? Math.round(
          (safeValue / safeTotal) * 100
        )
      : 0;

  return (
    <div
      className={`health-card ${accent}`}
    >

      <div className="health-icon">
        {icon}
      </div>

      <div className="health-content">

        <span>{label}</span>

        <strong>{safeValue}</strong>

        <small>
          {percentage}% of total assets
        </small>

      </div>

      <div className="health-progress">
        <div
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

    </div>
  );
}


/* =====================================================
   STATUS MINI CARD
===================================================== */

function StatusMiniCard({
  label,
  value,
  icon,
  accent,
}) {
  return (
    <div
      className={`status-mini-card ${accent}`}
    >

      <div className="status-mini-icon">
        {icon}
      </div>

      <div>
        <strong>
          {Number(value || 0)}
        </strong>

        <span>{label}</span>
      </div>

    </div>
  );
}


/* =====================================================
   PRIORITY TICKET
===================================================== */

function PriorityTicket({ ticket }) {
  const priority =
    ticket.priority || "MEDIUM";

  return (
    <div className="priority-ticket">

      <div className="priority-ticket-main">

        <div
          className={`priority-badge ${priority.toLowerCase()}`}
        >
          {priority}
        </div>

        <div>

          <h4>
            {ticket.title ||
              "Maintenance Issue"}
          </h4>

          <p>
            {ticket.asset?.name ||
              "Unknown Asset"}

            {ticket.asset?.locationName
              ? ` • ${ticket.asset.locationName}`
              : ""}
          </p>

        </div>

      </div>

      <span className="priority-status">
        {ticket.status}
      </span>

    </div>
  );
}


/* =====================================================
   SLA CARD
===================================================== */

function SLACard({
  label,
  value,
  icon,
  accent,
}) {
  return (
    <div className={`sla-card ${accent}`}>

      <div className="sla-icon">
        {icon}
      </div>

      <div>

        <strong>
          {Number(value || 0)}
        </strong>

        <span>{label}</span>

      </div>

    </div>
  );
}


/* =====================================================
   RECENT TICKET
===================================================== */

function RecentTicket({ ticket }) {
  return (
    <div className="recent-item">

      <div className="recent-item-icon">
        🎫
      </div>

      <div className="recent-item-content">

        <h4>
          {ticket.title ||
            "Maintenance Ticket"}
        </h4>

        <p>
          {ticket.asset?.name ||
            "Unknown Asset"}

          {ticket.asset?.assetCode
            ? ` • ${ticket.asset.assetCode}`
            : ""}
        </p>

      </div>

      <div className="recent-item-meta">

        <span
          className={`ticket-status ${(
            ticket.status || ""
          ).toLowerCase()}`}
        >
          {ticket.status}
        </span>

        <small>
          {ticket.priority}
        </small>

      </div>

    </div>
  );
}


/* =====================================================
   RECENT ASSET
===================================================== */

function RecentAsset({ asset }) {
  return (
    <div className="recent-item">

      <div className="recent-item-icon">
        🏢
      </div>

      <div className="recent-item-content">

        <h4>
          {asset.name}
        </h4>

        <p>
          {asset.assetCode}

          {asset.locationName
            ? ` • ${asset.locationName}`
            : ""}
        </p>

      </div>

      <div className="recent-item-meta">

        <span
          className={`asset-status ${(
            asset.status || ""
          ).toLowerCase()}`}
        >
          {asset.status}
        </span>

      </div>

    </div>
  );
}


/* =====================================================
   TECHNICIAN WORKLOAD
===================================================== */

function TechnicianWorkload({
  technician,
}) {
  return (
    <div className="workload-item">

      <div className="technician-avatar">
        {technician.name
          ?.charAt(0)
          ?.toUpperCase() || "T"}
      </div>

      <div className="workload-info">

        <h4>
          {technician.name}
        </h4>

        <p>
          {technician.email ||
            "Technician"}
        </p>

      </div>

      <div className="workload-count">

        <strong>
          {Number(
            technician.activeTickets || 0
          )}
        </strong>

        <span>
          Active Tickets
        </span>

      </div>

    </div>
  );
}


/* =====================================================
   INFRASTRUCTURE MODAL
===================================================== */

function InfrastructureModal({
  stats,
  onClose,
}) {
  const activeTickets =
    Number(stats.open || 0) +
    Number(stats.assigned || 0) +
    Number(stats.inProgress || 0);

  const completedTickets =
    Number(stats.resolved || 0) +
    Number(stats.closed || 0);

  return (
    <div
      className="overview-modal-overlay"
      onClick={onClose}
    >

      <div
        className="overview-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="overview-modal-header">

          <div>

            <span className="modal-label">
              INFRASTRUCTURE
            </span>

            <h2>
              Infrastructure Overview
            </h2>

            <p>
              Complete organization health
              snapshot
            </p>

          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        <div className="overview-grid">

          <OverviewMetric
            icon="🏢"
            label="Total Assets"
            value={stats.assets}
          />

          <OverviewMetric
            icon="🟢"
            label="Working Assets"
            value={stats.workingAssets}
          />

          <OverviewMetric
            icon="🔴"
            label="Faulty Assets"
            value={stats.faultyAssets}
          />

          <OverviewMetric
            icon="🟡"
            label="Maintenance"
            value={stats.maintenanceAssets}
          />

          <OverviewMetric
            icon="🎫"
            label="Active Tickets"
            value={activeTickets}
          />

          <OverviewMetric
            icon="✅"
            label="Completed Tickets"
            value={completedTickets}
          />

          <OverviewMetric
            icon="👨‍🔧"
            label="Technicians"
            value={stats.technicians}
          />

          <OverviewMetric
            icon="👥"
            label="Users"
            value={stats.users}
          />

        </div>


        <div className="overview-health">

          <div className="overview-health-header">

            <strong>
              Overall Asset Health
            </strong>

            <span>
              {stats.assets > 0
                ? Math.round(
                    ((stats.workingAssets || 0) /
                      stats.assets) *
                      100
                  )
                : 0}
              %
            </span>

          </div>

          <div className="overview-health-track">

            <div
              style={{
                width: `${
                  stats.assets > 0
                    ? Math.round(
                        ((stats.workingAssets || 0) /
                          stats.assets) *
                          100
                      )
                    : 0
                }%`,
              }}
            />

          </div>

        </div>


        <div className="overview-modal-footer">

          <span>
            ● Live organization data
          </span>

          <button
            onClick={onClose}
          >
            Done
          </button>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   OVERVIEW METRIC
===================================================== */

function OverviewMetric({
  icon,
  label,
  value,
}) {
  return (
    <div className="overview-metric">

      <div className="overview-metric-icon">
        {icon}
      </div>

      <div>

        <strong>
          {Number(value || 0)}
        </strong>

        <span>{label}</span>

      </div>

    </div>
  );
}


/* =====================================================
   INTERACTIVE STAT CARD
===================================================== */

function InteractiveStat({
  icon,
  label,
  value,
  description,
  accent = "blue",
  danger = false,
}) {
  const [animatedValue, setAnimatedValue] =
    useState(0);

  useEffect(() => {
    const target = Number(value) || 0;

    if (target === 0) {
      setAnimatedValue(0);
      return;
    }

    let current = 0;

    const increment = Math.max(
      1,
      Math.ceil(target / 20)
    );

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      setAnimatedValue(current);
    }, 30);

    return () =>
      clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`interactive-stat ${accent} ${
        danger ? "danger" : ""
      }`}
    >

      <div className="stat-top">

        <div className="stat-icon">
          {icon}
        </div>

        <span className="stat-arrow">
          ↗
        </span>

      </div>

      <div className="stat-number">
        {animatedValue}
      </div>

      <h3>{label}</h3>

      <p>{description}</p>

      <div className="stat-line">
        <span></span>
      </div>

    </div>
  );
}


/* =====================================================
   PROGRESS CARD
===================================================== */

function ProgressCard({
  title,
  value,
  description,
  danger = false,
}) {
  const safeValue = Math.min(
    100,
    Math.max(0, Number(value) || 0)
  );

  return (
    <div
      className={`progress-card ${
        danger
          ? "progress-danger"
          : ""
      }`}
    >

      <div className="progress-header">

        <div>

          <h3>{title}</h3>

          <p>{description}</p>

        </div>

        <strong>
          {safeValue}%
        </strong>

      </div>

      <div className="progress-track">

        <div
          className="progress-fill"
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =====================================================
   INFO CARD
===================================================== */

function InfoCard({
  icon,
  title,
  text,
  clickable = false,
  onClick,
}) {
  const content = (
    <>
      <div className="info-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <span className="info-arrow">
        →
      </span>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className="info-card info-card-clickable"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="info-card">
      {content}
    </div>
  );
}


/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({
  icon,
  text,
}) {
  return (
    <div className="dashboard-empty">
      <span>{icon}</span>
      <p>{text}</p>
    </div>
  );
}