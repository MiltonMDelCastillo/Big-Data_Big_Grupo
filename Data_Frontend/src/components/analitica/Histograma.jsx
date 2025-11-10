import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography, MenuItem, Select, Box } from "@mui/material";
import { BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer, Label } from "recharts";

export default function Histograma({ data }) {
  const [selectedVar, setSelectedVar] = useState("temperature");

  const varSettings = {
    temperature: { label: "Temperatura (°C)", binSize: 5, min: -20, max: 60, color: "#f44336" },
    humidity: { label: "Humedad (%)", binSize: 10, min: 0, max: 100, color: "#1976d2" },
    pressure: { label: "Presión (hPa)", binSize: 5, min: 950, max: 1050, color: "#4caf50" },
    battery: { label: "Batería (V)", binSize: 0.2, min: 0, max: 5, color: "#ff9800" },
    rss: { label: "RSS (dBm)", binSize: 10, min: -120, max: 0, color: "#9c27b0" },
    snr: { label: "SNR (dB)", binSize: 5, min: -10, max: 30, color: "#00bcd4" },
  };

  const chartData = useMemo(() => {
    const settings = varSettings[selectedVar];
    const numBins = Math.ceil((settings.max - settings.min) / settings.binSize);
    const bins = Array.from({ length: numBins }, (_, i) => ({
      range: `${(settings.min + i * settings.binSize).toFixed(0)}-${(
        settings.min +
        (i + 1) * settings.binSize
      ).toFixed(0)}`,
      count: 0,
      sensors: new Set(), // para contar sensores distintos
    }));

    data.forEach((d) => {
      const val = d[selectedVar];
      if (val != null) {
        let binIndex = Math.floor((val - settings.min) / settings.binSize);
        if (binIndex < 0) binIndex = 0;
        if (binIndex >= bins.length) binIndex = bins.length - 1;
        bins[binIndex].count += 1;
        bins[binIndex].sensors.add(d.device);
      }
    });

    // Convertir Set a número de sensores
    return bins.map((b) => ({ ...b, sensorsCount: b.sensors.size }));
  }, [data, selectedVar]);

  if (!chartData.length) return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#000" }}>
            Histograma de {varSettings[selectedVar].label}
          </Typography>
          <Select
            value={selectedVar}
            onChange={(e) => setSelectedVar(e.target.value)}
            size="small"
            sx={{ minWidth: 160, background: "#fff", borderRadius: 1 }}
          >
            {Object.keys(varSettings).map((v) => (
              <MenuItem key={v} value={v}>
                {varSettings[v].label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <XAxis dataKey="range">
              <Label
                value={varSettings[selectedVar].label}
                position="bottom"
                offset={10}
                style={{ fontWeight: 700, fill: "#000" }}
              />
            </XAxis>
            <YAxis>
              <Label
                angle={-90}
                value="Número de mediciones"
                position="insideLeft"
                style={{ textAnchor: "middle", fontWeight: 700, fill: "#000" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value) => [`${value}`, "Cantidad de mediciones"]}
              labelFormatter={(label, payload) =>
                `Rango: ${label} → ${payload[0]?.payload.sensorsCount || 0} sensores diferentes`
              }
            />
            <Bar dataKey="count" fill={varSettings[selectedVar].color} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

Histograma.propTypes = {
  data: PropTypes.array.isRequired,
};
