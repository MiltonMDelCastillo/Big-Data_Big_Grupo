
import os, io, csv, json, datetime as dt
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from pymongo import MongoClient

# ===== CONFIG =====
MAPPING = {
  "time": "time",
  "devEui": "deviceInfo.devEui",
  "deviceName": "deviceInfo.deviceName",
  "profileName": "deviceInfo.deviceProfileName",
  "tenantName": "deviceInfo.tenantName",
  "tagName": "deviceInfo.tags.Name",
  "tagDesc": "deviceInfo.tags.Description",
  "tagAddress": "deviceInfo.tags.Address",
  "lat": None,
  "lon": None,
  "co2": "object.co2",
  "temperature": "object.temperature",
  "humidity": "object.humidity",
  "pressure": "object.pressure",
  "battery": "object.battery",
  "charging": None,
  "rssi": "rxInfo[0].rssi",
  "snr": None,
  "dr": "dr",
  "fcnt": "fCnt"
}
USE_COLS = [c for c in MAPPING.values() if c]  # columnas que esperamos

load_dotenv()

pg_url = f"postgresql+psycopg2://{os.getenv('PGUSER')}:{os.getenv('PGPASSWORD')}@{os.getenv('PGHOST')}:{os.getenv('PGPORT')}/{os.getenv('PGDATABASE')}"
engine = create_engine(pg_url, pool_pre_ping=True)

mongo = MongoClient(os.getenv('MONGO_URI'))
mdb = mongo[os.getenv('MONGO_DB')]
events = mdb.events

CSV_PATH = os.getenv("CSV_PATH", "./data/input.csv")

def ensure_schema():
    with engine.begin() as conn:
        vars = [
            ('co2','ppm','Dióxido de carbono'),
            ('temperature','°C','Temperatura'),
            ('humidity','%','Humedad relativa'),
            ('pressure','hPa','Presión'),
            ('battery','%','Batería'),
            ('charging','bool','Cargando')
        ]
        for code,unit,desc in vars:
            conn.execute(text("INSERT INTO iot.variables (code, unit, description) VALUES (:c,:u,:d) ON CONFLICT (code) DO NOTHING"), {"c":code,"u":unit,"d":desc})

def upsert_station(conn, rec):
    q = text("""
      INSERT INTO iot.stations (dev_eui, device_name, profile_name, tenant_name,
                                tag_name, tag_desc, tag_address, lat, lon)
      VALUES (:dev_eui, :device_name, :profile_name, :tenant_name,
              :tag_name, :tag_desc, :tag_address, :lat, :lon)
      ON CONFLICT (dev_eui) DO UPDATE SET
        device_name=EXCLUDED.device_name,
        profile_name=EXCLUDED.profile_name,
        tenant_name=EXCLUDED.tenant_name,
        tag_name=EXCLUDED.tag_name,
        tag_desc=EXCLUDED.tag_desc,
        tag_address=EXCLUDED.tag_address,
        lat=EXCLUDED.lat, lon=EXCLUDED.lon
      RETURNING id;
    """)
    return conn.execute(q, rec).scalar()

def copy_measurements(conn, rows):
    buf = io.StringIO()
    buf.write("dev_eui,ts,variable_code,value_num,value_bool,rssi,snr,dr,fcnt,raw_json\n")
    for r in rows:
        buf.write(",".join([
            r["dev_eui"],
            r["ts"].isoformat(),
            r["variable_code"],
            "" if r["value_num"] is None else str(r["value_num"]),
            "" if r["value_bool"] is None else ("true" if r["value_bool"] else "false"),
            "" if r["rssi"] is None else str(r["rssi"]),
            "" if r["snr"] is None else str(r["snr"]),
            (r["dr"] or ""),
            "" if r["fcnt"] is None else str(r["fcnt"]),
            json.dumps(r.get("raw_json") or {})
        ]) + "\n")
    buf.seek(0)
    with conn.connection.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS stg;")
        cur.execute("""
          CREATE TEMP TABLE stg (dev_eui text, ts timestamptz, variable_code text,
            value_num double precision, value_bool boolean,
            rssi double precision, snr double precision, dr text, fcnt int, raw_json jsonb);
        """)
        cur.copy_expert("COPY stg FROM STDIN CSV HEADER", buf)
        cur.execute("""
          INSERT INTO iot.measurements (station_id, ts, variable_id, value_num, value_bool, quality_json, raw_json)
          SELECT s.id,
                 stg.ts,
                 v.id,
                 stg.value_num,
                 stg.value_bool,
                 jsonb_build_object('rssi', stg.rssi, 'snr', stg.snr, 'dr', stg.dr, 'fcnt', stg.fcnt),
                 stg.raw_json
          FROM stg
          JOIN iot.stations  s ON s.dev_eui = stg.dev_eui
          JOIN iot.variables v ON v.code   = stg.variable_code
          ON CONFLICT (station_id, ts, variable_id) DO NOTHING;
        """)

def normalize_row(row):
    def g(key):
        col = MAPPING.get(key)
        return row.get(col) if col else None

    # timestamp
    t = g("time")
    if not t:
        return None
    # parse ISO or similar
    ts = dt.datetime.fromisoformat(t.replace("Z","+00:00")) if "Z" in t or "+" in t else dt.datetime.fromisoformat(t)

    dev = g("devEui")
    if not dev:
        return None

    # station record
    station = {
        "dev_eui": dev,
        "device_name": g("deviceName"),
        "profile_name": g("profileName"),
        "tenant_name": g("tenantName"),
        "tag_name": g("tagName"),
        "tag_desc": g("tagDesc"),
        "tag_address": g("tagAddress"),
        "lat": float(g("lat")) if g("lat") not in (None,"") else None,
        "lon": float(g("lon")) if g("lon") not in (None,"") else None,
    }

    # values
    obj = {
        "co2": g("co2"),
        "temperature": g("temperature"),
        "humidity": g("humidity"),
        "pressure": g("pressure"),
        "battery": g("battery"),
        "charging": g("charging"),
    }
    # coerce
    for k in ["co2","temperature","humidity","pressure","battery"]:
        if obj[k] in (None, ""):
            obj[k] = None
        else:
            try:
                obj[k] = float(obj[k])
            except:
                obj[k] = None
    if isinstance(obj["charging"], str):
        obj["charging"] = obj["charging"].lower() in ("1","true","t","yes","y")

    rx = {
        "rssi": (float(g("rssi")) if g("rssi") not in (None,"") else None),
        "snr": (float(g("snr")) if g("snr") not in (None,"") else None),
        "dr": g("dr"),
        "fcnt": (int(g("fcnt")) if g("fcnt") not in (None,"") else None),
    }

    return ts, station, obj, rx

def main():
    ensure_schema()

    # Mongo bulk + Postgres COPY per batch
    batch_docs = []
    rows_pg = []
    with engine.begin() as conn, open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        # upsert stations cache
        seen = set()
        for row in reader:
            norm = normalize_row(row)
            if not norm:
                continue
            ts, station, obj, rx = norm

            if station["dev_eui"] not in seen:
                upsert_station(conn, station)
                seen.add(station["dev_eui"])

            # Mongo document
            doc = {
                "time": ts.isoformat(),
                "device": {
                    "devEui": station["dev_eui"],
                    "name": station["device_name"],
                    "profile": station["profile_name"],
                    "tenant": station["tenant_name"],
                    "tag": {
                        "name": station["tag_name"],
                        "desc": station["tag_desc"],
                        "address": station["tag_address"],
                        "location": {"lat": station["lat"], "lon": station["lon"]}
                    }
                },
                "object": obj,
                "rx": rx
            }
            batch_docs.append(doc)

            # Postgres rows flat
            for code, val in obj.items():
                if code == "charging":
                    rows_pg.append({
                        "dev_eui": station["dev_eui"],
                        "ts": ts,
                        "variable_code": "charging",
                        "value_num": None,
                        "value_bool": val,
                        "rssi": rx["rssi"], "snr": rx["snr"], "dr": rx["dr"], "fcnt": rx["fcnt"],
                        "raw_json": None
                    })
                else:
                    if val is None: 
                        continue
                    rows_pg.append({
                        "dev_eui": station["dev_eui"],
                        "ts": ts,
                        "variable_code": code,
                        "value_num": val,
                        "value_bool": None,
                        "rssi": rx["rssi"], "snr": rx["snr"], "dr": rx["dr"], "fcnt": rx["fcnt"],
                        "raw_json": None
                    })

            # flush in chunks
            if len(batch_docs) >= 5000:
                events.insert_many(batch_docs, ordered=False)
                copy_measurements(conn, rows_pg)
                batch_docs.clear()
                rows_pg.clear()

        # flush remaining
        if batch_docs:
            events.insert_many(batch_docs, ordered=False)
        if rows_pg:
            copy_measurements(conn, rows_pg)

if __name__ == "__main__":
    print("Leyendo CSV desde:", CSV_PATH)
    main()
    print("Listo.")
