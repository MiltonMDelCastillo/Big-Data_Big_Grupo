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

/* ========== STATIONS ========== */
app.get("/stations", (req, res) => {
  const { page, limit } = req.query;
  res.json(paginate(stations, page, limit));
});

/* ========== VARIABLES ========== */
app.get("/variables", (req, res) => {
  const { page, limit } = req.query;
  res.json(paginate(variables, page, limit));
});

/* ========== MEASUREMENTS ========== */
app.get("/measurements", (req, res) => {
  const { page, limit, station_id, variable_id } = req.query;
  let array = measurements;

  if (station_id) array = array.filter(m => String(m.station_id) === String(station_id));
  if (variable_id) array = array.filter(m => String(m.variable_id) === String(variable_id));

  res.json(paginate(array, page, limit));
});

/* ========== EVENTS ========== */
app.get("/events", (req, res) => {
  const { page, limit, device } = req.query;
  let array = events;
  if (device) array = array.filter(e => String(e.device).toLowerCase().includes(String(device).toLowerCase()));
  res.json(paginate(array, page, limit));
});

/* ========== JOINED: measurements + station + variable ========== */
app.get("/measurements/joined", (req, res) => {
  const { page, limit, station_id } = req.query;
  let array = measurements;

  if (station_id) array = array.filter(m => String(m.station_id) === String(station_id));

  const joined = array.map(m => {
    const station = stations.find(s => s.id === m.station_id) || null;
    const variable = variables.find(v => v.id === m.variable_id) || null;
    return {
      ...m,
      station,
      variable
    };
  });

  res.json(paginate(joined, page, limit));
});

/* ========== JOINED: events + station + latest measurements (example) ========== */
app.get("/events/joined", (req, res) => {
  const { page, limit } = req.query;

  // Para cada evento, adjuntamos la estación (buscando por device == device_name)
  const joined = events.map(ev => {
    const station = stations.find(s => s.device_name === ev.device) || null;

    // obtenemos últimas 3 mediciones para esa estación (si existe)
    const latestMeasurements = station
      ? measurements
          .filter(m => m.station_id === station.id)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts))
          .slice(0, 3)
      : [];

    return {
      ...ev,
      station,
      latestMeasurements
    };
  });

  res.json(paginate(joined, page, limit));
});

/* ========== UTIL: buscar por device + combinaciones ========== */
app.get("/search/full", (req, res) => {
  const { q, page, limit } = req.query;
  const query = String(q || "").toLowerCase();

  // estaciones que coinciden
  const matchedStations = stations.filter(s =>
    s.device_name.toLowerCase().includes(query) ||
    s.dev_eui.toLowerCase().includes(query) ||
    s.tag_name.toLowerCase().includes(query)
  );

  // eventos que coinciden
  const matchedEvents = events.filter(e =>
    e.device.toLowerCase().includes(query) ||
    e.tag.toLowerCase().includes(query)
  );

  // mediciones que coinciden por station
  const stationIds = matchedStations.map(s => s.id);
  const matchedMeasurements = measurements.filter(m => stationIds.includes(m.station_id));

  const combined = {
    stations: matchedStations,
    events: matchedEvents,
    measurements: matchedMeasurements
  };

  res.json(paginate([combined], page, limit)); // se envía como lista paginada; cliente adapta
});


/* ========== START SERVER ========== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API FAKE corriendo en http://localhost:${PORT}`);
});
