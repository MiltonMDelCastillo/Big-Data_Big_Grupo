# Guía de Conexión a las Bases de Datos

## 📊 PostgreSQL

### Opción 1: Línea de comandos (Docker)
```powershell
# Conectarse interactivamente
docker exec -it storage_stack-postgres-1 psql -U postgres -d iot

# Ejecutar una consulta directamente
docker exec -i storage_stack-postgres-1 psql -U postgres -d iot -c "SELECT * FROM iot.stations LIMIT 5;"
```

### Opción 2: Herramientas gráficas
Configuración para DBeaver, pgAdmin, DataGrip, etc.:
- **Host:** `localhost`
- **Puerto:** `5432`
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Base de datos:** `iot`

### Consultas de ejemplo
```sql
-- Ver todas las estaciones
SELECT * FROM iot.stations;

-- Ver variables disponibles
SELECT * FROM iot.variables;

-- Contar mediciones
SELECT COUNT(*) FROM iot.measurements;

-- Ver últimas 10 mediciones
SELECT m.ts, s.dev_eui, v.code, m.value_num, m.value_bool
FROM iot.measurements m
JOIN iot.stations s ON s.id = m.station_id
JOIN iot.variables v ON v.id = m.variable_id
ORDER BY m.ts DESC
LIMIT 10;

-- Promedio por minuto de CO2 para una estación
WITH v AS (SELECT id FROM iot.variables WHERE code='co2')
SELECT date_trunc('minute', ts) AS t, avg(value_num) AS co2_avg
FROM iot.measurements m
JOIN v ON v.id = m.variable_id
JOIN iot.stations s ON s.id = m.station_id
WHERE s.dev_eui = '<TU_DEV_EUI>'
  AND ts >= now() - interval '24 hours'
GROUP BY 1
ORDER BY 1;
```

---

## 🍃 MongoDB

### Opción 1: Línea de comandos (Docker)
```powershell
# Conectarse interactivamente
docker exec -it storage_stack-mongo-1 mongosh iot

# Ejecutar una consulta directamente
docker exec -i storage_stack-mongo-1 mongosh iot --quiet --eval "db.events.countDocuments()"
```

### Opción 2: MongoDB Compass
1. Descarga MongoDB Compass desde: https://www.mongodb.com/try/download/compass
2. Conecta usando:
   - **URI:** `mongodb://localhost:27017`
   - **Base de datos:** `iot`

### Consultas de ejemplo (JavaScript para mongosh)
```javascript
// Cambiar a la base de datos
use iot

// Contar documentos
db.events.countDocuments()

// Ver primeros 5 documentos
db.events.find().limit(5).pretty()

// Buscar por devEui
db.events.find({ "device.devEui": "TU_DEV_EUI" }).limit(10)

// Buscar eventos con CO2 > 400
db.events.find({ "object.co2": { $gt: 400 } }).limit(10)

// Agregación: promedio de CO2 por dispositivo
db.events.aggregate([
  { $match: { "object.co2": { $exists: true, $ne: null } } },
  { $group: {
      _id: "$device.devEui",
      avgCO2: { $avg: "$object.co2" },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgCO2: -1 } }
])
```

---

## 🔧 Verificar que todo está funcionando

```powershell
# Ver estado de los contenedores
docker compose ps

# Ver logs de PostgreSQL
docker logs storage_stack-postgres-1

# Ver logs de MongoDB
docker logs storage_stack-mongo-1
```

