
import React, { useEffect, useState } from "react";
import api from "../api";
import "./ManageUsers.css";

export default function ManageUsers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician"
  });

  async function loadMembers() {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setMembers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load organisation members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, []);

  async function addMember(e) {
    e.preventDefault();
    setError("");

    try {
      setSaving(true);
      const { data } = await api.post("/users/members", form);
      alert(data.message);
      setForm({ name: "", email: "", password: "", role: "technician" });
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add member.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(membershipId) {
    if (!window.confirm("Remove this person from your organisation?")) return;

    try {
      await api.delete(`/users/members/${membershipId}`);
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Could not remove member.");
    }
  }

  return (
    <div className="manage-users-page">
      <div className="page-header">
        <div>
          <h1>Organisation People</h1>
          <p>Add admins and technicians to this organisation. A technician can belong to multiple organisations.</p>
        </div>
      </div>

      <div className="member-layout">
        <form className="card member-form" onSubmit={addMember}>
          <h2>Add member</h2>
          <p className="muted">
            Existing technician accounts are simply connected to this organisation.
          </p>

          {error && <div className="error-message">{error}</div>}

          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="technician">Technician</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <label>Full name</label>
          <input
            required
            value={form.name}
            placeholder="Full name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label>Email</label>
          <input
            required
            type="email"
            value={form.email}
            placeholder="person@example.com"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            placeholder="Required only for a new account"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button disabled={saving}>
            {saving ? "Adding..." : `Add ${form.role}`}
          </button>
        </form>

        <div className="card members-card">
          <div className="members-card-head">
            <div>
              <h2>Current members</h2>
              <p className="muted">{members.length} people connected to this organisation</p>
            </div>
          </div>

          {loading ? (
            <p>Loading members...</p>
          ) : !members.length ? (
            <div className="empty-state">No members found.</div>
          ) : (
            <div className="member-list">
              {members.map((member) => (
                <div className="member-row" key={member.membershipId}>
                  <div className="table-avatar">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-main">
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </div>
                  <span className={`role-badge ${member.role}`}>
                    {member.role}
                  </span>
                  <span className={`member-status ${member.status.toLowerCase()}`}>
                    {member.status}
                  </span>
                  <button
                    className="remove-member"
                    onClick={() => removeMember(member.membershipId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
