import React, { useEffect, useState } from "react";
import api from "../api";
import "./MaintenanceHistory.css";

export default function MaintenanceHistory({ asset, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(
          `/tickets/maintenance/${asset._id}`
        );

        setHistory(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load maintenance history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [asset._id]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="maintenance-overlay" onClick={onClose}>
      <div
        className="maintenance-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* CLOSE */}
        <button
          className="maintenance-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* HEADER */}
        <div className="maintenance-header">
          <h2>Maintenance History</h2>

          <p>
            {asset.name} · {asset.assetCode}
          </p>

          <div className="maintenance-summary">
            <div>
              <span>Added On</span>
              <strong>{formatDate(asset.createdAt)}</strong>
            </div>

            <div>
              <span>Total Repairs</span>
              <strong>{history.length}</strong>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="maintenance-content">

          {loading && (
            <div className="maintenance-state">
              Loading maintenance history...
            </div>
          )}

          {!loading && error && (
            <div className="maintenance-error">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="maintenance-state">
              <div className="maintenance-empty-icon">
                🔧
              </div>

              <strong>No repairs yet</strong>

              <p>
                This asset has not been repaired yet.
              </p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="maintenance-list">

              {history.map((record, index) => (
                <div
                  className="maintenance-item"
                  key={record._id}
                >

                  <div className="repair-icon">
                    🔧
                  </div>

                  <div className="repair-details">

                    <div className="repair-top">
                      <strong>
                        Repair #{history.length - index}
                      </strong>

                      <span>
                        {formatDate(record.createdAt)}
                      </span>
                    </div>

                    <div className="repair-info">
                      <p>
                        <b>Status:</b> Completed
                      </p>

                      <p>
                        <b>Technician:</b>{" "}
                        {record.technician?.name || "N/A"}
                      </p>

                      {record.note && (
                        <p>
                          <b>Note:</b> {record.note}
                        </p>
                      )}
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
