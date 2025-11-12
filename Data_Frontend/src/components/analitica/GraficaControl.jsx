import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from "recharts";

export default function GraficaControl({ data }) {
  // Variables disponibles para análisis de control
  const variables = {
    temperature: { label: "Temperatura (°C)", color: "#e53935" }, // rojo
    humidity: { label: "Humedad (%)", color: "#1e88e5" }, // azul
    pressure: { label: "Presión (hPa)", color: "#43a047" }, // verde
    rss: { label: "RSS (dBm)", color: "#fb8c00" }, // naranja
    snr: { label: "SNR (dB)", color: "#8e24aa" } // morado
  };

  // Estado: variables seleccionadas
  const [selectedVars, setSelectedVars] = useState(["temperature"]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        time: new Date(d.time).toLocaleTimeString(),
        temperature: d.temperature,
        humidity: d.humidity,
        pressure: d.pressure,
        rss: d.rss,
        snr: d.snr
      })),
    [data]
  );

  // Calcular límites de control
  const controlLimits = useMemo(() => {
    const limits = {};

    selectedVars.forEach((v) => {
      const values = chartData
        .map((item) => item[v])
        .filter((x) => x != null);

      if (!values.length) {
        limits[v] = { avg: null, ucl: null, lcl: null };
        return;
      }

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const std =
        Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
            values.length
        ) || 0;

      // Límites de control clásicos
      limits[v] = {
        avg,
        ucl: avg + 2 * std,
        lcl: avg - 2 * std
      };
    });

    return limits;
  }, [selectedVars, chartData]);

  const toggleVar = (v) => {
    setSelectedVars((prev) =>
      prev.includes(v)
        ? prev.filter((x) => x !== v)
        : [...prev, v]
    );
  };

  if (!chartData.length)
    return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Gráfica de Control
        </Typography>

        {/* Selección múltiple con checkboxes */}
        <FormGroup row sx={{ mb: 2 }}>
          {Object.keys(variables).map((v) => (
            <FormControlLabel
              key={v}
              control={
                <Checkbox
                  checked={selectedVars.includes(v)}
                  onChange={() => toggleVar(v)}
                />
              }
              label={variables[v].label}
            />
          ))}
        </FormGroup>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />

            {/* Líneas para cada variable seleccionada */}
            {selectedVars.map((v) => (
              <React.Fragment key={v}>
                <Line
                  type="monotone"
                  dataKey={v}
                  stroke={variables[v].color}
                  strokeWidth={2}
                  dot={false}
                />

                <ReferenceLine
                  y={controlLimits[v].avg}
                  stroke={variables[v].color}
                  strokeDasharray="4 4"
                  label={`${variables[v].label} Promedio`}
                />

                <ReferenceLine
                  y={controlLimits[v].ucl}
                  stroke={variables[v].color}
                  strokeDasharray="2 2"
                />
                <ReferenceLine
                  y={controlLimits[v].lcl}
                  stroke={variables[v].color}
                  strokeDasharray="2 2"
                />
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

GraficaControl.propTypes = {
  data: PropTypes.array.isRequired
};
