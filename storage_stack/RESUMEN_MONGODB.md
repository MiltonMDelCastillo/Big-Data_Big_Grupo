# 📊 Resumen: MongoDB para IoT

## 🎯 ¿Por qué MongoDB?

### Comparación Rápida

| Criterio | PostgreSQL | MongoDB | Ganador |
|----------|-----------|---------|---------|
| **Velocidad de Escritura** | ~2,000 inserts/s | ~10,000+ inserts/s | 🏆 MongoDB |
| **Estructura de Datos** | 3 tablas (stations, variables, measurements) | 1 documento = 1 evento | 🏆 MongoDB |
| **Consultas** | Requiere JOINs | Consulta directa | 🏆 MongoDB |
| **Flexibilidad** | Esquema fijo | Esquema flexible | 🏆 MongoDB |
| **Escalabilidad** | Vertical | Horizontal automática | 🏆 MongoDB |

---

## 📋 Esquema de Datos MongoDB

### Estructura del Documento en la colección `events`:

```
{
  "_id": ObjectId(...),
  "time": "2024-11-15T20:17:08.108000+00:00",
  
  "device": {
    "devEui": "24e124126d376993",
    "name": "EMS-6993",
    "profile": "EM500-CO2-915M",
    "tenant": "...",
    "tag": {
      "name": "Sensor CO2",
      "desc": "...",
      "address": "...",
      "location": { "lat": -17.39, "lon": -66.15 }
    }
  },
  
  "object": {
    "co2": 450,
    "temperature": 22.5,
    "humidity": 65.2,
    "pressure": 1013.25,
    "battery": 85,
    "charging": false
  },
  
  "rx": {
    "rssi": -120,
    "snr": 8.5,
    "dr": "SF7BW125",
    "fcnt": 1234
  }
}
```

---

## 🔑 Ventajas Clave

1. ✅ **Un documento = Un evento completo** (sin JOINs)
2. ✅ **Alta velocidad de escritura** (ideal para IoT)
3. ✅ **Estructura natural** (JSON nativo)
4. ✅ **Escalabilidad horizontal** (MongoDB Atlas)
5. ✅ **Flexibilidad** (nuevos campos sin cambiar esquema)

---

## 📈 Datos del Proyecto

- **Documentos:** 16,288 eventos
- **Base de datos:** `iot`
- **Colección:** `events`
- **Índices:** 3 (devEui+time, co2+time, rssi)
- **Hosting:** MongoDB Atlas (cloud)

