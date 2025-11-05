
CREATE SCHEMA IF NOT EXISTS iot;

CREATE TABLE IF NOT EXISTS iot.stations (
  id            BIGSERIAL PRIMARY KEY,
  dev_eui       TEXT UNIQUE NOT NULL,
  device_name   TEXT,
  profile_name  TEXT,
  tenant_name   TEXT,
  tag_name      TEXT,
  tag_desc      TEXT,
  tag_address   TEXT,
  lat           DOUBLE PRECISION,
  lon           DOUBLE PRECISION,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iot.variables (
  id           SMALLSERIAL PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  unit         TEXT,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS iot.measurements (
  station_id   BIGINT NOT NULL REFERENCES iot.stations(id),
  ts           TIMESTAMPTZ NOT NULL,
  variable_id  SMALLINT NOT NULL REFERENCES iot.variables(id),
  value_num    DOUBLE PRECISION,
  value_bool   BOOLEAN,
  quality_json JSONB,
  raw_json     JSONB,
  PRIMARY KEY (station_id, ts, variable_id)
) PARTITION BY RANGE (ts);

-- Partición ejemplo para noviembre 2024
CREATE TABLE IF NOT EXISTS iot.measurements_2024_11
  PARTITION OF iot.measurements FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE INDEX IF NOT EXISTS ix_meas_station_ts ON iot.measurements (station_id, ts);
CREATE INDEX IF NOT EXISTS ix_meas_ts ON iot.measurements (ts DESC);
CREATE INDEX IF NOT EXISTS ix_meas_var ON iot.measurements (variable_id);
CREATE INDEX IF NOT EXISTS ix_meas_quality_gin ON iot.measurements USING GIN (quality_json);
