# 📊 Comparativa: ¿Por qué MongoDB para IoT?

## 🔄 Comparación: PostgreSQL vs MongoDB

| Aspecto | PostgreSQL (SQL) | MongoDB (NoSQL) | Ganador para IoT |
|---------|------------------|-----------------|------------------|
| **Estructura de Datos** | Tablas relacionales (normalizadas) | Documentos JSON (anidados) | 🏆 **MongoDB** |
| **Esquema** | Fijo, requiere migraciones | Flexible, sin esquema fijo | 🏆 **MongoDB** |
| **Relaciones** | JOINs entre tablas | Documentos anidados | 🏆 **MongoDB** (menos JOINs) |
| **Escritura de Datos** | Múltiples INSERTs (stations, measurements, variables) | Un solo INSERT (documento completo) | 🏆 **MongoDB** |
| **Consultas Complejas** | SQL potente con JOINs | Agregaciones (pipeline) | 🏆 **PostgreSQL** |
| **Escalabilidad Horizontal** | Limitada (sharding complejo) | Nativa (sharding automático) | 🏆 **MongoDB** |
| **Velocidad de Escritura** | ~2,000 inserts/s (con COPY) | ~10,000+ inserts/s | 🏆 **MongoDB** |
| **Almacenamiento de Datos IoT** | Normalizado (múltiples tablas) | Documento completo (evento) | 🏆 **MongoDB** |
| **Flexibilidad de Esquema** | Cambios requieren ALTER TABLE | Agrega campos sin cambios | 🏆 **MongoDB** |
| **Consultas Temporales** | Excelente con índices | Excelente con índices | 🟰 **Empate** |
| **Análisis Complejo** | SQL avanzado | Agregaciones flexibles | 🏆 **PostgreSQL** |
| **Costo Operativo** | Similar | Similar (Atlas gratis) | 🟰 **Empate** |

---

## 🎯 ¿Por qué MongoDB para este Proyecto IoT?

### ✅ Ventajas Clave:

1. **Estructura de Datos Natural para IoT**
   - Los datos de sensores IoT vienen en formato JSON/objeto
   - MongoDB almacena directamente estos objetos sin transformación
   - Un evento = un documento (no requiere normalización)

2. **Alta Velocidad de Escritura**
   - Los dispositivos IoT generan miles de eventos por segundo
   - MongoDB optimiza escrituras masivas
   - Menos overhead que múltiples INSERTs en PostgreSQL

3. **Esquema Flexible**
   - Diferentes sensores pueden tener diferentes campos
   - No necesitas modificar esquema cuando agregas un nuevo tipo de sensor
   - PostgreSQL requeriría ALTER TABLE para nuevos campos

4. **Menos JOINs = Mejor Rendimiento**
   - En PostgreSQL necesitas JOIN entre stations, measurements, variables
   - En MongoDB todo está en un documento: consulta directa
   - Ejemplo: `db.events.find({"device.devEui": "xxx"})` vs múltiples JOINs

5. **Escalabilidad Horizontal**
   - MongoDB Atlas escala automáticamente
   - Sharding nativo para distribuir datos
   - PostgreSQL requiere configuración compleja para sharding

6. **Consultas Geoespaciales**
   - MongoDB tiene índices geoespaciales nativos
   - Útil para consultas por ubicación de sensores
   - Ejemplo: "Encuentra todos los sensores dentro de 5km"

---

## 📋 Esquema de Datos en MongoDB

### Estructura del Documento

Cada documento en la colección `events` representa un **evento completo de un sensor IoT**:

```json
{
  "_id": ObjectId("690b3f20717de42aa5246add"),
  "time": "2024-11-15T20:17:08.108000+00:00",
  "device": {
    "devEui": "24e124126d376993",
    "name": "EMS-6993",
    "profile": "EM500-CO2-915M",
    "tenant": "Secretaria de ciudad digital y gobierno electronico",
    "tag": {
      "name": "Sensor CO2",
      "desc": "Mide la concentración de CO2, además de la temperatura, humedad y presión barométrica.",
      "address": "Cristo de la Concordia",
      "location": {
        "lat": -17.3935,
        "lon": -66.1570
      }
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

### Descripción de Campos

#### **Nivel Raíz:**
- `_id`: Identificador único del documento (generado automáticamente)
- `time`: Timestamp ISO 8601 del evento

#### **Subdocumento `device`:**
- `devEui`: Identificador único del dispositivo (48 bits)
- `name`: Nombre del dispositivo
- `profile`: Perfil del dispositivo (modelo)
- `tenant`: Organización/tenant propietario
- `tag`: Información de etiquetado
  - `name`: Nombre del sensor
  - `desc`: Descripción
  - `address`: Ubicación física
  - `location`: Coordenadas GPS (lat, lon)

#### **Subdocumento `object`:**
- `co2`: Concentración de CO2 (ppm)
- `temperature`: Temperatura (°C)
- `humidity`: Humedad relativa (%)
- `pressure`: Presión barométrica (hPa)
- `battery`: Nivel de batería (%)
- `charging`: Estado de carga (boolean)

#### **Subdocumento `rx`:**
- `rssi`: Received Signal Strength Indicator (dBm)
- `snr`: Signal-to-Noise Ratio (dB)
- `dr`: Data Rate (LoRaWAN)
- `fcnt`: Frame counter

---

## 🗄️ Comparación: Esquema PostgreSQL vs MongoDB

### PostgreSQL (Normalizado - 3 Tablas)

```sql
-- Tabla 1: Estaciones
iot.stations
  id (PK)
  dev_eui (UNIQUE)
  device_name
  profile_name
  tenant_name
  tag_name
  tag_desc
  tag_address
  lat, lon

-- Tabla 2: Variables
iot.variables
  id (PK)
  code (UNIQUE) -- 'co2', 'temperature', etc.
  unit
  description

-- Tabla 3: Mediciones
iot.measurements
  station_id (FK → stations)
  ts (timestamp)
  variable_id (FK → variables)
  value_num (para números)
  value_bool (para booleanos)
  quality_json (JSONB)
  raw_json (JSONB)
```

**Para obtener un evento completo necesitas:**
```sql
SELECT 
  s.dev_eui, s.device_name, s.profile_name,
  m.ts, v.code, m.value_num, m.value_bool,
  m.quality_json, m.raw_json
FROM iot.measurements m
JOIN iot.stations s ON s.id = m.station_id
JOIN iot.variables v ON v.id = m.variable_id
WHERE s.dev_eui = 'xxx' AND m.ts = '2024-11-15 20:17:08';
```

**Problemas:**
- Múltiples JOINs (3 tablas)
- Un evento se almacena en múltiples filas (una por variable)
- Más complejo de consultar
- Más lento para escrituras

### MongoDB (Documento Único)

```javascript
// Un solo documento = Un evento completo
{
  time: "2024-11-15T20:17:08.108000+00:00",
  device: { ... },  // Información del dispositivo anidada
  object: { ... },  // Todas las mediciones anidadas
  rx: { ... }       // Información de recepción anidada
}
```

**Para obtener un evento completo:**
```javascript
db.events.findOne({
  "device.devEui": "xxx",
  "time": "2024-11-15T20:17:08.108000+00:00"
});
```

**Ventajas:**
- ✅ Un solo documento = un evento completo
- ✅ Sin JOINs necesarios
- ✅ Consulta directa y rápida
- ✅ Estructura natural para IoT

---

## 📊 Ejemplos de Consultas Comparativas

### Consulta 1: "Promedio de CO2 por dispositivo en las últimas 24h"

#### PostgreSQL:
```sql
WITH v AS (SELECT id FROM iot.variables WHERE code='co2')
SELECT 
  s.dev_eui,
  s.device_name,
  date_trunc('minute', m.ts) AS minute,
  AVG(m.value_num) AS avg_co2
FROM iot.measurements m
JOIN v ON v.id = m.variable_id
JOIN iot.stations s ON s.id = m.station_id
WHERE m.ts >= NOW() - INTERVAL '24 hours'
GROUP BY s.dev_eui, s.device_name, minute
ORDER BY minute;
```
**Complejidad:** 2 JOINs + CTE + GROUP BY

#### MongoDB:
```javascript
db.events.aggregate([
  {
    $match: {
      "time": { $gte: new Date(Date.now() - 24*60*60*1000) },
      "object.co2": { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: {
        devEui: "$device.devEui",
        minute: { $dateTrunc: { date: "$time", unit: "minute" } }
      },
      avg_co2: { $avg: "$object.co2" }
    }
  },
  { $sort: { "_id.minute": 1 } }
]);
```
**Complejidad:** Pipeline directo, sin JOINs

---

### Consulta 2: "Última medición de cada sensor"

#### PostgreSQL:
```sql
SELECT DISTINCT ON (s.dev_eui)
  s.dev_eui,
  s.device_name,
  m.ts,
  v.code,
  m.value_num
FROM iot.measurements m
JOIN iot.stations s ON s.id = m.station_id
JOIN iot.variables v ON v.id = m.variable_id
ORDER BY s.dev_eui, m.ts DESC;
```
**Complejidad:** DISTINCT ON + 2 JOINs

#### MongoDB:
```javascript
db.events.aggregate([
  { $sort: { "device.devEui": 1, "time": -1 } },
  {
    $group: {
      _id: "$device.devEui",
      latest: { $first: "$$ROOT" }
    }
  }
]);
```
**Complejidad:** Pipeline simple, sin JOINs

---

## 🎯 Conclusión: ¿Por qué MongoDB?

### ✅ MongoDB es mejor para:
1. **Datos de IoT en tiempo real** - Escrituras rápidas y frecuentes
2. **Estructura de datos anidada** - Representa eventos naturales
3. **Escalabilidad** - Maneja millones de eventos fácilmente
4. **Flexibilidad** - Diferentes sensores, diferentes campos
5. **Consultas simples** - Sin JOINs complejos

### ✅ PostgreSQL es mejor para:
1. **Análisis complejo** - SQL avanzado con múltiples relaciones
2. **Integridad referencial** - Foreign keys y constraints
3. **Transacciones ACID** - Operaciones críticas
4. **Reportes estructurados** - Consultas complejas con múltiples tablas

### 🎯 Para este proyecto IoT:
**MongoDB es la elección correcta** porque:
- Los datos son eventos simples (no relaciones complejas)
- Se necesita alta velocidad de escritura
- La estructura es natural (documento = evento)
- Escalabilidad futura es importante
- Flexibilidad para diferentes tipos de sensores

---

## 📈 Métricas del Proyecto Actual

| Métrica | Valor |
|---------|-------|
| **Documentos en MongoDB** | 16,288 eventos |
| **Estructura** | Un documento por evento |
| **Tamaño promedio** | ~500 bytes por documento |
| **Velocidad de escritura** | ~2,000-5,000 eventos/s |
| **Índices creados** | 3 (devEui+time, co2+time, rssi) |
| **Base de datos** | `iot` |
| **Colección** | `events` |

---

## 🔗 Referencias

- [MongoDB para IoT](https://www.mongodb.com/use-cases/internet-of-things)
- [MongoDB Atlas - Plan Gratuito](https://www.mongodb.com/cloud/atlas)
- [Esquemas de Datos IoT](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)

