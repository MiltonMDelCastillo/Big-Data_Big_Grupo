
// Ejecutar con: mongosh --file create_indexes.js
db = db.getSiblingDB(process.env.MONGO_DB || "iot");
db.events.createIndex({ "device.devEui": 1, time: -1 });
db.events.createIndex({ "object.co2": 1, time: -1 });
db.events.createIndex({ "rx.rssi": -1 });
