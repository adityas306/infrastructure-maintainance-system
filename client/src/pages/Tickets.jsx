import React from "react";
import { useEffect, useState } from "react";
import api from "../api";

export default function Tickets({user}) {
  const [tickets,setTickets]=useState([]);
  const [techs,setTechs]=useState([]);
  const [selected,setSelected]=useState({});

  async function load(){
    const {data}=await api.get("/tickets");
    setTickets(data);
    if(user.role==="admin"){
      const t=await api.get("/users/technicians");
      setTechs(t.data);
    }
  }
  useEffect(()=>{load()},[]);

  async function assign(id){
    await api.put(`/tickets/${id}/assign`,{technicianId:selected[id]});
    load();
  }

  async function status(id,status){
    await api.put(`/tickets/${id}/status`,{status,resolutionNote: status==="RESOLVED" ? "Repair completed successfully." : ""});
    load();
  }

  return (
    <>
      <h1>Tickets</h1>
      <div className="grid">
        {tickets.map(t=>{
          const late = t.slaDeadline && new Date(t.slaDeadline) < new Date() && !["RESOLVED","CLOSED"].includes(t.status);
          return <div className="card" key={t._id}>
            <div className="row"><h3>{t.title}</h3><span className="badge">{t.status}</span></div>
            <p><b>Asset:</b> {t.asset?.assetCode} — {t.asset?.name}</p>
            <p>{t.description}</p>
            <p><b>Priority:</b> {t.priority}</p>
            <p className={late ? "late" : ""}><b>SLA:</b> {new Date(t.slaDeadline).toLocaleString()} {late ? " — BREACHED" : ""}</p>
            <p><b>Technician:</b> {t.technician?.name || "Not assigned"}</p>

            {user.role==="admin" && !["RESOLVED","CLOSED"].includes(t.status) && (
              <div className="actions">
                <select value={selected[t._id]||""} onChange={e=>setSelected({...selected,[t._id]:e.target.value})}>
                  <option value="">Select technician</option>
                  {techs.map(x=><option key={x._id} value={x._id}>{x.name}</option>)}
                </select>
                <button onClick={()=>assign(t._id)} disabled={!selected[t._id]}>Assign</button>
              </div>
            )}

            {user.role==="technician" && ["ASSIGNED","IN_PROGRESS"].includes(t.status) && (
              <div className="actions">
                <button className="secondary" onClick={()=>status(t._id,"IN_PROGRESS")}>Start Work</button>
                <button onClick={()=>status(t._id,"RESOLVED")}>Resolve</button>
              </div>
            )}
          </div>
        })}
      </div>
    </>
  );
}
