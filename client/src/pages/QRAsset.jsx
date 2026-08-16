import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams } from "react-router-dom";

export default function QRAsset() {
  const { value } = useParams();
  const decoded = decodeURIComponent(value);

  return (
    <div className="center card">
      <h1>Asset QR</h1>
      <p>Print this QR and attach it to the physical asset.</p>
      <QRCodeCanvas value={decoded} size={260} includeMargin />
      <h2>{decoded}</h2>
      <button onClick={()=>window.print()}>Print QR</button>
    </div>
  );
}
