import React from "react";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function MapPage(){
  const [assets,setAssets]=useState([]);
  useEffect(()=>{api.get("/assets").then(r=>setAssets(r.data))},[]);
  const points=assets.filter(a=>Number.isFinite(a.latitude)&&Number.isFinite(a.longitude));
  const center=points.length?[points[0].latitude,points[0].longitude]:[26.8467,80.9462];

  return (
    <>
      <h1>Map OF InfraStructure</h1>
      <div className="map card">
        <MapContainer center={center} zoom={15} style={{height:"600px",width:"100%"}}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          {points.map(a=>(
            <Marker key={a._id} position={[a.latitude,a.longitude]}>
              <Popup><b>{a.name}</b><br/>{a.assetCode}<br/>Status: {a.status}<br/>{a.locationName}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
