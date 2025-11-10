import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css"; // NUEVO CSS

function App() {
  const [sensores, setSensores] = useState([]);
  const [mostrarDiagrama, setMostrarDiagrama] = useState(false);
  const mapRef = useRef();
  const [zoomCoords, setZoomCoords] = useState(null);

  const sensorIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [25, 25],
    iconAnchor: [12, 25],
  });

  const ZoomTo = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      if (lat && lng) map.setView([lat, lng], 16);
    }, [lat, lng]);
    return null;
  };

  useEffect(() => {
    const csvUrl = process.env.PUBLIC_URL + "/datos_limpios.csv";

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data
          .filter((row) => row.ubicacion && row.ubicacion !== "NoData")
          .slice(0, 100)
          .map((row) => {
            const coords = row.ubicacion.split(",");
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            return {
              nombre: row.nombre_sensor,
              tipo: row.tipo,
              valor: parseFloat(row.valor) || 0,
              lat,
              lng,
              bateria: row.bateria,
              ubicacion: row.ubicacion,
              fecha: row.fecha,
            };
          })
          .filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
        setSensores(data);
      },
    });
  }, []);

  return (
    <div className="dashboard-container">
      <h1>Dashboard de Sensores Futurista</h1>

      {/* MAPA */}
      <div className="map-container">
        <MapContainer
          center={[-17.39, -66.15]}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {sensores.map((s, i) => (
            <Marker key={i} position={[s.lat, s.lng]} icon={sensorIcon}>
              <Popup>
                <b>{s.nombre}</b>
                <br />
                Tipo: {s.tipo}
                <br />
                Valor: {s.valor}
                <br />
                Batería: {s.bateria}
              </Popup>
            </Marker>
          ))}
          {zoomCoords && <ZoomTo lat={zoomCoords.lat} lng={zoomCoords.lng} />}
        </MapContainer>
      </div>

      {/* TABLA */}
      <div className="tabla-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {sensores.map((s, i) => (
              <tr key={i}>
                <td>{s.nombre}</td>
                <td>{s.ubicacion}</td>
                <td>
                  <button onClick={() => setZoomCoords({ lat: s.lat, lng: s.lng })}>
                    Ver en mapa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DIAGRAMA DE DISPERSIÓN */}
      <div className="scatter-container">
        <button
          className="btn-diagrama"
          onClick={() => setMostrarDiagrama(!mostrarDiagrama)}
        >
          {mostrarDiagrama ? "Ocultar diagrama de dispersión" : "Mostrar diagrama de dispersión"}
        </button>

        {mostrarDiagrama && (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid stroke="#444" strokeDasharray="5 5" />
              <XAxis type="category" dataKey="tipo" name="Tipo de sensor" stroke="#fff"/>
              <YAxis type="number" dataKey="valor" name="Valor" stroke="#fff"/>
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter name="Sensores" data={sensores} fill="#00ffcc" />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default App;
