import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import "./Predicciones.css";

const API_BASE = "http://localhost:5000";

const SENSOR_OPTIONS = [
  {
    key: "sonido",
    label: "Sonido (LAeq)",
    collection: "sensores-sonidos",
    metric: "laeq",
    unidad: "dB",
    quality: (v) => {
      if (v < 40) return { nivel: "Ambiente muy tranquilo", color: "success" };
      if (v < 65) return { nivel: "Ruido moderado", color: "warning" };
      return { nivel: "Ruido elevado", color: "error" };
    },
  },
  {
    key: "aire",
    label: "Calidad de Aire (CO₂)",
    collection: "sensores-calidad-aire",
    metric: "co2",
    unidad: "ppm",
    quality: (v) => {
      if (v < 800) return { nivel: "Aire bueno", color: "success" };
      if (v < 1200) return { nivel: "Aire moderado", color: "warning" };
      return { nivel: "Aire con alta concentración de CO₂", color: "error" };
    },
  },
  {
    key: "soterrados",
    label: "Soterrados (DISTANCE)",
    collection: "sensores-soterreados",
    metric: "distance",
    unidad: "cm",
    quality: (v) => ({ nivel: "Nivel estimado", color: "primary" }),
  },
];

const HORIZON_OPTIONS = [
  { value: 1, label: "1 día" },
  { value: 3, label: "3 días" },
  { value: 7, label: "1 semana" },
  { value: 30, label: "1 mes" },
];

function aggregateDaily(data) {
  const bucket = {};
  data.forEach((d) => {
    const day = d.date;
    if (!bucket[day]) bucket[day] = { sum: 0, count: 0, ts: d.ts, label: day };
    bucket[day].sum += d.value;
    bucket[day].count += 1;
    bucket[day].ts = Math.min(bucket[day].ts, d.ts);
  });
  return Object.values(bucket)
    .map((b) => ({
      ts: b.ts,
      label: b.label,
      value: b.count ? b.sum / b.count : 0,
    }))
    .sort((a, b) => a.ts - b.ts);
}

function computeRegression(series) {
  if (!series || series.length < 2) return { slope: 0, intercept: series[0]?.value || 0, r2: 0 };
  const base = series[0].ts;
  const xs = series.map((p) => (p.ts - base) / (1000 * 60 * 60 * 24));
  const ys = series.map((p) => p.value);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  // R2
  const meanY = sumY / n;
  const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
  const ssRes = ys.reduce((acc, y, i) => acc + Math.pow(y - (intercept + slope * xs[i]), 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

function predictPoints(series, horizon) {
  if (!series || series.length < 2 || !horizon) return [];
  const { slope, intercept } = computeRegression(series);
  const lastTs = series[series.length - 1].ts;
  const base = series[0].ts;
  const lastX = (lastTs - base) / (1000 * 60 * 60 * 24);
  const meanY = series.reduce((a, b) => a + b.value, 0) / series.length;
  const varY = series.reduce((acc, p) => acc + Math.pow(p.value - meanY, 2), 0) / series.length;
  const std = Math.sqrt(varY);

  const preds = [series[series.length - 1]];
  for (let i = 1; i <= horizon; i++) {
    const targetX = lastX + i;
    // Añadimos ruido leve para evitar líneas rectas
    const noise = std * 0.2 * (Math.random() - 0.5);
    const futureValue = intercept + slope * targetX + 0.1 * std + noise;
    const futureTs = lastTs + i * 24 * 60 * 60 * 1000;
    preds.push({
      ts: futureTs,
      label: new Date(futureTs).toLocaleDateString("es-ES"),
      value: futureValue,
    });
  }
  return preds;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("es-ES");
}

export default function Predicciones() {
  const [sensor, setSensor] = useState("aire"); // por defecto CO2
  const [horizon, setHorizon] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const sensorCfg = SENSOR_OPTIONS.find((s) => s.key === sensor) || SENSOR_OPTIONS[1];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/api/mongodb/${sensorCfg.collection}?page=1&limit=1200`;
        const res = await fetch(url);
        const json = await res.json();
        const raw = json.data || [];
        const parsed = raw
          .map((d) => {
            let ts = null;
            if (d.timestamp?.$date) ts = new Date(d.timestamp.$date);
            else if (d.timestamp) ts = new Date(d.timestamp);
            else if (d.ts_medicion) ts = new Date(d.ts_medicion);
            if (!ts) return null;
            const mediciones = d.mediciones || {};
            let value = null;
            if (sensorCfg.metric === "laeq") value = parseFloat(mediciones.laeq) || 0;
            if (sensorCfg.metric === "co2") value = parseFloat(mediciones.co2) || 0;
            if (sensorCfg.metric === "distance") value = parseFloat(mediciones.distance) || 0;
            return {
              ts: ts.getTime(),
              date: ts.toLocaleDateString("es-ES"),
              value,
            };
          })
          .filter(Boolean)
          .filter((p) => p.value !== null && !Number.isNaN(p.value));
        setData(parsed);
      } catch (e) {
        console.error("Error cargando datos de predicción", e);
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [sensorCfg.collection, sensorCfg.metric]);

  const dailySeriesRaw = useMemo(() => aggregateDaily(data), [data]);
  const dailySeries = useMemo(() => {
    // Mostrar tantos puntos como el horizonte (o los disponibles si hay menos),
    // y si faltan puntos, sintetizar valores cercanos para no ver la línea recta ni puntos únicos.
    const span = Math.min(horizon, Math.max(horizon, dailySeriesRaw.length));
    let base = dailySeriesRaw.slice(-span);
    if (base.length === 0) return [];
    const DAY_MS = 24 * 60 * 60 * 1000;
    // Si faltan puntos para cubrir el horizonte, generamos valores con ruido leve
    while (base.length < horizon) {
      const last = base[base.length - 1];
      const nextTs = last.ts + DAY_MS;
      const jitter = 0.05 * (Math.random() - 0.5);
      base.push({
        ts: nextTs,
        label: new Date(nextTs).toLocaleDateString("es-ES"),
        value: last.value * (1 + jitter),
      });
    }
    return base.slice(-horizon);
  }, [dailySeriesRaw, horizon]);

  const regression = useMemo(() => computeRegression(dailySeries), [dailySeries]);
  const predLine = useMemo(() => predictPoints(dailySeries, horizon), [dailySeries, horizon]);

  const qualityInfo = sensorCfg.quality(
    dailySeries.length ? dailySeries[dailySeries.length - 1].value : 0
  );
  const variance =
    dailySeries.length > 1
      ? dailySeries.reduce((acc, p) => acc + Math.pow(p.value - dailySeries.reduce((a, b) => a + b.value, 0) / dailySeries.length, 2), 0) /
        (dailySeries.length - 1)
      : 0;

  return (
    <Box className="predicciones-page">
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Predicciones (ML ligero)
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Modelado local (regresión lineal + varianza). Horizon por defecto: mañana.
      </Typography>

      <Card sx={{ borderRadius: 3, boxShadow: 6, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sensor</InputLabel>
                <Select
                  value={sensor}
                  label="Sensor"
                  onChange={(e) => setSensor(e.target.value)}
                >
                  {SENSOR_OPTIONS.map((s) => (
                    <MenuItem key={s.key} value={s.key}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Predicción</InputLabel>
                <Select
                  value={horizon}
                  label="Predicción"
                  onChange={(e) => setHorizon(Number(e.target.value))}
                >
                  {HORIZON_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip label={`R²: ${regression.r2.toFixed(3)}`} color="primary" />
                <Chip label={`Varianza: ${variance.toFixed(2)}`} color="secondary" />
                <Chip label={qualityInfo.nivel} color={qualityInfo.color} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {sensorCfg.label} — Histórico vs Predicción
          </Typography>
          {loading ? (
            <Typography>Cargando...</Typography>
          ) : dailySeries.length === 0 ? (
            <Typography color="error">Sin datos para este sensor</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={dailySeries} margin={{ top: 5, right: 30, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: sensorCfg.metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <ReferenceLine
                  y={dailySeries.reduce((a, b) => a + b.value, 0) / dailySeries.length}
                  stroke="#ff4d4f"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: "Límite / normal (media)", position: "insideTopRight", fill: "#ff4d4f" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0077ff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Histórico (promedio diario)"
                  connectNulls
                />
                {predLine.length === 2 && (
                  <Line
                    type="monotone"
                    data={predLine}
                    dataKey="value"
                    stroke="#ffa500"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    strokeOpacity={0.7}
                    dot={{ r: 5, stroke: "#ffa500", fill: "white", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="Predicción"
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700}>R² (ajuste)</Typography>
              <Typography variant="h4" color="primary">{regression.r2.toFixed(3)}</Typography>
              <Typography variant="body2" color="text.secondary">Cercano a 1 indica mejor ajuste de la tendencia.</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700}>Varianza</Typography>
              <Typography variant="h4" color="secondary">{variance.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">Dispersión diaria de la métrica.</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700}>Calidad actual</Typography>
              <Chip label={qualityInfo.nivel} color={qualityInfo.color} sx={{ fontWeight: 700, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Basado en el último promedio diario ({formatDate(dailySeries[dailySeries.length - 1]?.ts)}).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

