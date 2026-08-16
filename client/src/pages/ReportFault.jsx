import React from "react";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSearchParams } from "react-router-dom";
import api from "../api";

export default function ReportFault() {
  const [params] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState(params.get("asset") || "");
  const [form, setForm] = useState({title:"",description:"",priority:"MEDIUM"});
  const [message, setMessage] = useState("");

  useEffect(()=>{
    api.get("/assets").then(r=>setAssets(r.data));
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 220 });
    scanner.render(async (decodedText)=>{
      try {
        const {data} = await api.get(`/assets/qr/${encodeURIComponent(decodedText)}`);
        setAssetId(data._id);
        setMessage(`QR matched: ${data.name} (${data.assetCode})`);
        scanner.clear().catch(()=>{});
      } catch {
        setMessage("QR does not match a registered asset.");
      }
    }, ()=>{});
    return () => scanner.clear().catch(()=>{});
  },[]);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/tickets", {...form, assetId});
      setMessage("Fault reported successfully.");
      setForm({title:"",description:"",priority:"MEDIUM"});
    } catch(e) {
      setMessage(e.response?.data?.message || "Could not report fault");
    }
  }

  return (
    <>
      <h1>Report Fault</h1>
      <div className="two">
        <div className="card">
          <h2>Scan Asset QR</h2>
          <div id="qr-reader"></div>
        </div>
        <form className="card form" onSubmit={submit}>
          <h2>Fault Details</h2>
          {message && <div className="notice">{message}</div>}
          <select value={assetId} onChange={e=>setAssetId(e.target.value)}>
            <option value="">Select asset</option>
            {assets.map(a=><option key={a._id} value={a._id}>{a.assetCode} — {a.name}</option>)}
          </select>
          <input required placeholder="Issue title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <textarea required placeholder="Describe the problem" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
          <button disabled={!assetId}>Submit Fault</button>
        </form>
      </div>
    </>
  );
}
