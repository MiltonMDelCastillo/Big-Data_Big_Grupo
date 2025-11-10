// Data_Backend/fakeData.js
// Simulación realista de 4 colecciones y relaciones

function randomFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeObjectId() {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) id += randChoice(hex);
  return id;
}

/* ========== STATIONS ========== */
const stations = [];
const zoneNames = ["Centro", "Norte", "Sur", "Este", "Oeste"];
for (let i = 1; i <= 50; i++) {
  stations.push({
    id: i,
    dev_eui: `DEVEUI${1000 + i}`,
    device_name: `Device_${i}`,
    profile_name: randChoice(["Default Profile", "Weather Sensor", "Telemetry"]),
    tenant_name: randChoice(["TenantA", "TenantB", "TenantC"]),
    tag_name: randChoice(["TagA", "TagB", "TagC", "TagD"]),
    tag_desc: `Descripción de tag ${i}`,
    tag_address: `${i} Calle Falsa`,
    lat: randomFloat(-17.8, -16.0, 6),
    lon: randomFloat(-68.5, -65.0, 6),
  });
}

/* ========== VARIABLES ========== */
const variables = [];
const varCodes = ["T", "H", "P", "BAT", "VIB"];
for (let i = 1; i <= 40; i++) {
  variables.push({
    id: i,
    code: randChoice(varCodes),
    variable_id: `var_${i}`,
    value_num: randomFloat(0, 100, 3),
    value_bool: Math.random() > 0.5,
    quality_json: { quality: randChoice(["good", "ok", "bad"]) },
    raw_json: { raw: `raw_value_${i}` },
  });
}

/* ========== MEASUREMENTS ========== */
const measurements = [];
for (let i = 0; i < 1000; i++) {
  const station = randChoice(stations);
  const variable = randChoice(variables);
  measurements.push({
    id: i + 1,
    station_id: station.id,
    ts: new Date(Date.now() - i * 60000).toISOString(),
    variable_id: variable.id,
    value_num: randomFloat(-20, 60, 3),
    double_precision: randomFloat(-20, 60, 6),
    quality_json: { q: randChoice(["good", "suspect", "bad"]) },
    raw_json: { payload: `payload_${i}` },
  });
}

/* ========== EVENTS ========== */
const events = [];
for (let i = 0; i < 500; i++) {
  const station = randChoice(stations);
  events.push({
    _id: makeObjectId(),
    time: new Date(Date.now() - i * 45000).toISOString(),
    device: station.device_name, // clave para join con stations
    tag: station.tag_name,
    object: {
      temperature: randomFloat(-5, 45, 2),
      humidity: randomFloat(10, 95, 2),
      pressure: randomFloat(900, 1100, 2),
      battery: randomFloat(2.5, 4.2, 2),
      charging: Math.random() > 0.6
    },
    rx: {
      rss: Math.floor(randomFloat(-120, -40, 0)),
      snr: randomFloat(-10, 30, 1),
      dr: randChoice([0,1,2,3,4,5,6])
    }
  });
}

module.exports = {
  stations,
  measurements,
  variables,
  events
};
