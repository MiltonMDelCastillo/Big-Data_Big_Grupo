// Data_Backend/fakeData.js

function randomFloat(min, max, decimals = 2) {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
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

/* ======= CALL CENTER STREETS ======= */
const streets = [
  "Ballivián", "España", "Ayacucho", "Blanco Galindo", "23 de Marzo",
  "Colonial", "La Paz", "Santa Cruz", "Sucre", "Potosí",
  "Chuquisaca", "Cochabamba", "Independencia", "Oruro", "Tarija",
  "Alberdi", "Arce", "Calle Florida", "Isabel La Católica", "Aniceto Arce"
];

/* ======= STATIONS ======= */
const stations = [];
for (let i = 1; i <= 30; i++) {
  const street = randChoice(streets);
  const number = Math.floor(randomFloat(1, 100));
  stations.push({
    id: i,
    dev_eui: `DEV_CB_${1000 + i}`,
    device_name: `Sensor_CB_${i}`,
    station_name: `Estación_CB_${i}`,
    tag_name: `Tag_CB_${i}`,
    tag_desc: `Sensor del centro de Cochabamba, calle ${street}`,
    tag_address: `${street} #${number}`,  // dirección realista
    lat: randomFloat(-17.398, -17.36, 6),
    lon: randomFloat(-66.18, -66.15, 6),
    profile_name: randChoice(["Weather Sensor", "Telemetry", "Default Profile"]),
    tenant_name: randChoice(["TenantA", "TenantB"])
  });
}

/* ======= VARIABLES ======= */
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

/* ======= MEASUREMENTS ======= */
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

/* ======= EVENTS ======= */
const events = [];
for (let i = 0; i < 500; i++) {
  const station = randChoice(stations);
  events.push({
    _id: makeObjectId(),
    time: new Date(Date.now() - i * 45000).toISOString(),
    device: station.device_name,
    tag: station.tag_name,
    object: {
      temperature: randomFloat(15, 35, 1),
      humidity: randomFloat(30, 80, 1),    // Humidity ya incluido
      pressure: randomFloat(980, 1050, 2),
      battery: randomFloat(3, 4.2, 2),
      charging: Math.random() > 0.6
    },
    rx: {
      rss: Math.floor(randomFloat(-120, -40, 0)),
      snr: randomFloat(-10, 30, 1),
      dr: randChoice([0,1,2,3,4,5,6])
    },
    station: station  // incluimos estación completa para usar tag_address
  });
}

module.exports = {
  stations,
  measurements,
  variables,
  events
};
