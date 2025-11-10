import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography, Select, MenuItem, Box } from "@mui/material";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapaCalor({ data }) {
  const [selectedVar, setSelectedVar] = useState("temperature");

  // Configuración de colores tipo semáforo: verde-normal, amarillo-medio, rojo-alto
  const varSettings = {
    temperature: { label: "Temperatura (°C)", min: 0, max: 50, thresholds: [25, 35], colors: ["#4caf50", "#ffeb3b", "#f44336"] }, // verde, amarillo, rojo
    humidity: { label: "Humedad (%)", min: 0, max: 100, thresholds: [40, 70], colors: ["#4caf50", "#ffeb3b", "#f44336"] },
    pressure: { label: "Presión (hPa)", min: 950, max: 1050, thresholds: [980, 1020], colors: ["#4caf50", "#ffeb3b", "#f44336"] },
    battery: { label: "Batería (V)", min: 0, max: 5, thresholds: [2, 4], colors: ["#f44336", "#ffeb3b", "#4caf50"] }, // inverso: bajo = rojo
    rss: { label: "RSS (dBm)", min: -120, max: 0, thresholds: [-80, -50], colors: ["#f44336", "#ffeb3b", "#4caf50"] }, // pobre = rojo
    snr: { label: "SNR (dB)", min: -10, max: 30, thresholds: [5, 15], colors: ["#f44336", "#ffeb3b", "#4caf50"] }, // bajo = rojo
  };

  // Determinar color según valor y thresholds
  const getColor = (value) => {
    if (value == null) return "#ccc";
    const { thresholds, colors } = varSettings[selectedVar];
    if (value < thresholds[0]) return colors[0]; // verde o rojo según variable
    if (value < thresholds[1]) return colors[1]; // amarillo
    return colors[2]; // rojo o verde según variable
  };

  // Centrar mapa
  const center = useMemo(() => {
    if (!data.length) return [0, 0];
    const lats = data.map(d => d.lat || 0);
    const lons = data.map(d => d.lon || 0);
    return [lats.reduce((a,b)=>a+b,0)/lats.length, lons.reduce((a,b)=>a+b,0)/lons.length];
  }, [data]);

  if (!data.length) return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#000" }}>
            Mapa de Calor - {varSettings[selectedVar].label}
          </Typography>
          <Select
            value={selectedVar}
            onChange={(e) => setSelectedVar(e.target.value)}
            size="small"
            sx={{ minWidth: 160, background: "#fff", borderRadius: 1 }}
          >
            {Object.keys(varSettings).map((v) => (
              <MenuItem key={v} value={v}>{varSettings[v].label}</MenuItem>
            ))}
          </Select>
        </Box>

        <MapContainer center={center} zoom={13} style={{ height: 400, width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.map((d, i) => (
            <CircleMarker
              key={i}
              center={[d.lat, d.lon]}
              radius={10}
              fillColor={getColor(d[selectedVar])}
              fillOpacity={0.8}
              stroke={false}
            >
              <LeafletTooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <div>
                  <strong>{d.device}</strong> ({d.tag})<br />
                  {varSettings[selectedVar].label}: {d[selectedVar] ?? "N/A"}<br />
                  Dirección: {d.station_address}
                </div>
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}

MapaCalor.propTypes = {
  data: PropTypes.array.isRequired,
};
