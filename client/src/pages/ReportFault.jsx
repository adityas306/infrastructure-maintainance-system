import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import "./ReportFault.css";

export default function ReportFault() {
  const [params] = useSearchParams();

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState(
    params.get("asset") || ""
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/assets")
      .then((r) => setAssets(r.data))
      .catch(() => {
        setMessage("Unable to load assets.");
        setMessageType("error");
      });

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 220,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const { data } = await api.get(
            `/assets/qr/${encodeURIComponent(decodedText)}`
          );

          setAssetId(data._id);

          setMessage(
            `QR matched: ${data.name} (${data.assetCode})`
          );

          setMessageType("success");

          scanner.clear().catch(() => {});
        } catch {
          setMessage(
            "QR does not match a registered asset."
          );

          setMessageType("error");
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!assetId) {
      setMessage("Please select or scan an asset first.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      setMessage("");
      setMessageType("");

      await api.post("/tickets", {
        ...form,
        assetId,
      });

      setMessage("Fault reported successfully.");
      setMessageType("success");

      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
      });

    } catch (e) {
      setMessage(
        e.response?.data?.message ||
          "Could not report fault"
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fault-page">

      {/* Background decorations */}
      <div className="fault-circle fault-circle-one"></div>
      <div className="fault-circle fault-circle-two"></div>

      <div className="fault-container">

        {/* Page Header */}
        <div className="fault-header">

          <div className="fault-title">

            <div className="fault-title-icon">
              ⚠️
            </div>

            <div>
              <h1>Report Fault</h1>

              <p>
                Report infrastructure issues quickly
                and help keep assets maintained.
              </p>
            </div>

          </div>

          <div className="fault-status">
            ● Maintenance System
          </div>

        </div>

        {/* Main Content */}
        <div className="fault-grid">

          {/* QR Scanner */}
          <div className="fault-card scanner-card">

            <div className="card-heading">

              <div className="heading-icon">
                📱
              </div>

              <div>
                <h2>Scan Asset QR</h2>

                <p>
                  Scan the QR code attached to the asset
                </p>
              </div>

            </div>

            <div className="scanner-wrapper">

              <div id="qr-reader"></div>

            </div>

            <div className="scanner-help">
              <span>💡</span>

              <p>
                Point your camera at the asset QR code.
                The registered asset will be selected
                automatically.
              </p>
            </div>

          </div>

          {/* Fault Form */}
          <div className="fault-card form-card">

            <div className="card-heading">

              <div className="heading-icon">
                🛠️
              </div>

              <div>
                <h2>Fault Details</h2>

                <p>
                  Provide details about the issue
                </p>
              </div>

            </div>

            {/* Message */}

            {message && (
              <div
                className={`fault-message ${
                  messageType === "success"
                    ? "success"
                    : "error"
                }`}
              >
                <span>
                  {messageType === "success"
                    ? "✓"
                    : "⚠"}
                </span>

                {message}
              </div>
            )}

            <form onSubmit={submit}>

              {/* Asset */}

              <div className="form-group">

                <label>
                  Asset <span>*</span>
                </label>

                <div className="asset-select">

                  <span>🏗️</span>

                  <select
                    value={assetId}
                    onChange={(e) =>
                      setAssetId(e.target.value)
                    }
                  >
                    <option value="">
                      Select an asset
                    </option>

                    {assets.map((a) => (
                      <option
                        key={a._id}
                        value={a._id}
                      >
                        {a.assetCode} — {a.name}
                      </option>
                    ))}
                  </select>

                </div>

                {assetId && (
                  <div className="asset-selected">
                    ✓ Asset selected successfully
                  </div>
                )}

              </div>

              {/* Title */}

              <div className="form-group">

                <label>
                  Issue Title <span>*</span>
                </label>

                <input
                  required
                  type="text"
                  placeholder="e.g. Streetlight not working"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                />

              </div>

              {/* Priority */}

              <div className="form-group">

                <label>
                  Priority
                </label>

                <div className="priority-select">

                  <span>🚨</span>

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="LOW">
                      LOW
                    </option>

                    <option value="MEDIUM">
                      MEDIUM
                    </option>

                    <option value="HIGH">
                      HIGH
                    </option>

                    <option value="CRITICAL">
                      CRITICAL
                    </option>
                  </select>

                </div>

              </div>

              {/* Description */}

              <div className="form-group">

                <label>
                  Problem Description <span>*</span>
                </label>

                <textarea
                  required
                  rows="6"
                  placeholder="Describe the problem in detail..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />

                <small>
                  Provide enough information so the
                  maintenance team can understand the issue.
                </small>

              </div>

              {/* Submit */}

              <button
                type="submit"
                className="submit-fault"
                disabled={!assetId || loading}
              >

                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Fault Report
                    <span>→</span>
                  </>
                )}

              </button>

              {!assetId && (
                <p className="submit-help">
                  Please scan or select an asset before
                  submitting the report.
                </p>
              )}

            </form>

          </div>

        </div>

      </div>
    </div>
  );
}