import React, { useEffect, useState } from "react";
import api from "../api";
import "./ManageUsers.css";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId, newRole) {
    try {
      setUpdating(userId);
      setError("");

      const response = await api.patch(
        `/users/${userId}/role`,
        {
          role: newRole,
        }
      );

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? response.data.user
            : user
        )
      );

      alert("Role updated successfully!");
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
        "Failed to update role"
      );
    } finally {
      setUpdating(null);
    }
  }

  if (currentUser?.role !== "admin") {
    return (
      <div className="page-card">
        <h2>Access Denied</h2>
        <p>Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="manage-users-page">

      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p>
            View users and manage their roles.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          No users found.
        </div>
      ) : (
        <div className="users-table-container">

          <table className="users-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>

            <tbody>

              {users.map((user) => (

                <tr key={user._id}>

                  <td>
                    <div className="user-name">
                      <div className="table-avatar">
                        {user.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <span>
                        {user.name}
                      </span>
                    </div>
                  </td>

                  <td>
                    {user.email}
                  </td>

                  <td>
                    <span
                      className={`role-badge ${user.role}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td>

                    {user._id === currentUser?._id ? (

                      <span className="self-label">
                        Current Account
                      </span>

                    ) : (

                      <select
                        value={user.role}
                        disabled={
                          updating === user._id
                        }
                        onChange={(e) =>
                          changeRole(
                            user._id,
                            e.target.value
                          )
                        }
                      >

                        <option value="user">
                          User
                        </option>

                        <option value="technician">
                          Technician
                        </option>

                        <option value="admin">
                          Admin
                        </option>

                      </select>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}