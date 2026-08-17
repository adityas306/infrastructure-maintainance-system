import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Assets({ user }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ assetCode:"", name:"", category:"", locationName:"", latitude:"", longitude:"", description:"" });
  const [error, setError] = useState("");

  async function load() {
    const {data} = await api.get("/assets");
    setAssets(data);
  }

  useEffect(()=>{ load(); },[]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post("/assets", {...form, latitude:Number(form.latitude)||undefined, longitude:Number(form.longitude)||undefined});
      setForm({ assetCode:"", name:"", category:"", locationName:"", latitude:"", longitude:"", description:"" });
      load();
    } catch(e) { setError(e.response?.data?.message || "Only admin can create assets"); }
  }
  const handleDelete = async (id) => {
  try {
    await api.delete(`/assets/${id}`);

    setAssets((prev) =>
      prev.filter((asset) => asset._id !== id)
    );

    alert("Asset deleted successfully");
  } catch (err) {
    console.error(err);

    alert(
      err.response?.data?.message ||
      "Unable to delete asset"
    );
  }
};

  return (
    <>
      <h1>Assets</h1>
      {user.role === "admin" && (
        <form className="card form" onSubmit={create}>
          <h2>Add Asset</h2>
          {error && <div className="error">{error}</div>}
          <div className="two">
            <input placeholder="Asset Code e.g. LIGHT-001" value={form.assetCode} onChange={e=>setForm({...form,assetCode:e.target.value})}/>
            <input placeholder="Asset Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
            <input placeholder="Location" value={form.locationName} onChange={e=>setForm({...form,locationName:e.target.value})}/>
            <input placeholder="Latitude" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/>
            <input placeholder="Longitude" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <button>Create Asset + QR</button>
        </form>
      )}

      <div className="grid">
        {assets.map(a=>(
          <div className="card" key={a._id}>
            <div className="row"><h3>{a.name}</h3><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span></div>
            <p><b>{a.assetCode}</b> · {a.category}</p>
            <p>📍 {a.locationName}</p>
            <p>{a.description}</p>
            <div className="actions">
              <Link className="button" to={`/qr/${encodeURIComponent(a.qrValue)}`}>View QR</Link>
              <Link className="button secondary" to={`/report?asset=${a._id}`}>Report Fault</Link>
              
              {user.role === "admin" && (
                <button className="danger" onClick={() => handleDelete(a._id)}> Delete </button>
              )}
            </div>
          </div>
        ))}
        
      </div>
    </>
  );
}
