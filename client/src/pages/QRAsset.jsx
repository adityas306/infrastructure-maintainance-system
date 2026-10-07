import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate, useParams } from "react-router-dom";
import "./QRAsset.css";

export default function QRAsset() {
  const { value } = useParams();
  const navigate = useNavigate();

  const decoded = decodeURIComponent(value);

  return (
    <div className="center card qr-card">

      {/* Cross Button */}
      <button
        className="qr-close-btn"
        onClick={() => navigate(-1)}
        aria-label="Close"
      >
        ×
      </button>

      <h1>Asset QR</h1>

      <p>
        Print this QR and attach it to the physical asset.
      </p>

      <QRCodeCanvas
        value={decoded}
        size={260}
        includeMargin
      />

      <h2>{decoded}</h2>

      <button onClick={() => window.print()}>
        Print QR
      </button>

    </div>
  );
}