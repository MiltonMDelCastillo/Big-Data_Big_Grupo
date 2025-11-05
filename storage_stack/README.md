
# Integrante 4 – Storage (SQL + NoSQL)

## 0) Requisitos
- Docker + Docker Compose
- Python 3.10+
- (Opcional) `psql` y `mongosh` en tu PATH

## 1) Clonar y configurar
```bash
# Copia esta carpeta a tu proyecto
cp -r storage_stack ./integrante4_storage
cd integrante4_storage

# Crear .env desde el ejemplo
cp .env.example .env
# Edita .env si deseas cambiar credenciales o rutas
```

**Coloca tu CSV** en `./data/input.csv`. Si lo tienes en otro lado, ajusta `CSV_PATH` en `.env`.

> Tu archivo subido tiene headers tipo `deviceInfo.devEui`, `object.co2`, `time`, etc. El script ya viene mapeado a esos nombres.

## 2) Levantar infraestructura
```bash
docker compose up -d
```

## 3) Crear esquema en Postgres
```bash
# Instala psql si no lo tienes y ejecuta:
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f schema.sql
# contraseña por defecto: postgres
```

## 4) Crear índices en Mongo
```bash
# Requiere mongosh instalado en tu PC
export MONGO_DB=$(grep MONGO_DB .env | cut -d= -f2)
mongosh --eval "process.env.MONGO_DB='${MONGO_DB}'" --file create_indexes.js
```

## 5) Crear entorno Python e instalar deps
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 6) Ingestar el CSV a ambos destinos
```bash
# Asegúrate de que .env apunta a tu CSV (CSV_PATH). Por defecto: ./data/input.csv
python ingest_csv.py
```

## 7) Consultas de prueba
**Promedio por minuto de CO2 en las últimas 24h para un devEui:**

```sql
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

## 8) Rendimiento (criterios de aceptación)
- Escrituras históricas: usar `COPY` interno del script (chunks de 5k). Esperado ≥ 2 000 inserts/s en equipos modestos.
- Ventanas temporales: índices `(station_id, ts)` + partición mensual entregan tiempos sub-segundo en dataset de prueba.

## 9) Ajustar mapeo de columnas
Si tu CSV tiene nombres distintos, edita `MAPPING` al inicio de `ingest_csv.py` para apuntar a las columnas reales.
