import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// Tooltip personalizado
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: "#fff", padding: 6, border: "1px solid #ccc", borderRadius: 4 }}>
      <strong>{p.payload.device}</strong> ({p.payload.tag})<br />
      {Object.keys(p.payload)
        .filter(k => k !== "time" && k !== "device" && k !== "tag")
        .map(k => (
          <span key={k}>
            {k}: {p.payload[k] ?? "N/A"}<br />
          </span>
        ))}
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

export default function SerieTiempo({ data }) {
  const variables = {
    temperature: { label: "Temperatura (°C)", color: "#ff5722" },
    humidity: { label: "Humedad (%)", color: "#2196f3" },
    pressure: { label: "Presión (hPa)", color: "#4caf50" },
    battery: { label: "Batería (V)", color: "#ffc107" },
  };

  const [selectedVars, setSelectedVars] = useState(["temperature"]);

  const chartData = useMemo(() => {
    return data.map(d => {
      const obj = {
        time: new Date(d.time).toLocaleTimeString(),
        device: d.device,
        tag: d.tag,
      };
      selectedVars.forEach(v => (obj[v] = d[v]));
      return obj;
    });
  }, [data, selectedVars]);

  const handleToggleVar = (v) => {
    setSelectedVars(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  if (!chartData.length)
    return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#000" }}>
            Serie de Tiempo Interactiva
          </Typography>
          <FormGroup row>
            {Object.keys(variables).map(v => (
              <FormControlLabel
                key={v}
                control={
                  <Checkbox
                    checked={selectedVars.includes(v)}
                    onChange={() => handleToggleVar(v)}
                    sx={{ color: variables[v].color }}
                  />
                }
                label={variables[v].label}
              />
            ))}
          </FormGroup>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" label={{ value: "Hora del evento", position: "insideBottom", offset: -5 }} />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            {selectedVars.map(v => (
              <Line
                key={v}
                type="monotone"
                dataKey={v}
                stroke={variables[v].color}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

SerieTiempo.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string,
      device: PropTypes.string,
      tag: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      pressure: PropTypes.number,
      battery: PropTypes.number,
    })
  ).isRequired,
};
