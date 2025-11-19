// Data_Backend/server.js
const express = require("express");
const cors = require("cors");
const { stations, measurements, variables, events } = require("./fakeData");

const app = express();
app.use(cors());
app.use(express.json());

function paginate(array, page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page || 1));
  const l = Math.max(1, parseInt(limit || 20));
  const start = (p - 1) * l;
  const end = start + l;
  return {
    page: p,
    limit: l,
    total: array.length,
    totalPages: Math.ceil(array.length / l),
    data: array.slice(start, end)
  };
}

/* ======= STATIONS ======= */
app.get("/stations", (req, res) => {
  const { page, limit } = req.query;
  res.json(paginate(stations, page, limit));
});

/* ======= VARIABLES ======= */
app.get("/variables", (req, res) => {
  const { page, limit } = req.query;
  res.json(paginate(variables, page, limit));
});

/* ======= MEASUREMENTS ======= */
app.get("/measurements", (req, res) => {
  const { page, limit, station_id, variable_id } = req.query;
  let array = measurements;
  if (station_id) array = array.filter(m => String(m.station_id) === String(station_id));
  if (variable_id) array = array.filter(m => String(m.variable_id) === String(variable_id));
  res.json(paginate(array, page, limit));
});

/* ======= EVENTS ======= */
app.get("/events", (req, res) => {
  const { page, limit, device } = req.query;
  let array = events;
  if (device) array = array.filter(e => String(e.device).toLowerCase().includes(String(device).toLowerCase()));
  res.json(paginate(array, page, limit));
});

/* ======= JOINED EVENTS ======= */
app.get("/events/joined", (req, res) => {
  const { page, limit } = req.query;

  const joined = events.map(ev => {
    const station = stations.find(s => s.device_name === ev.device) || null;
    const latestMeasurements = station
      ? measurements
          .filter(m => m.station_id === station.id)
          .sort((a,b)=>new Date(b.ts)-new Date(a.ts))
          .slice(0,3)
      : [];
    return {
      ...ev,
      station,
      latestMeasurements,
      object: ev.object, // <- importante para que Humidity funcione
      rx: ev.rx            // <- para RSS/SNR
    };
  });

  res.json(paginate(joined, page, limit));
});

/* ======= START SERVER ======= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API FAKE corriendo en http://localhost:${PORT}`);
});
