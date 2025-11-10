import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

export default function GraficaControl({ data }) {
  const chartData = data.map(d => ({
    time: new Date(d.time).toLocaleTimeString(),
    temperature: d.temperature,
  }));

  if (!chartData.length) return <Typography>No hay datos para mostrar</Typography>;

  const temps = chartData.map(d => d.temperature).filter(t => t != null);
  const avg = temps.reduce((a,b) => a+b,0)/temps.length || 0;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          Gráfica de Control de Temperatura
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperature" stroke="#4b6cb7" />
            <ReferenceLine y={avg} stroke="red" strokeDasharray="3 3" label="Promedio" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

GraficaControl.propTypes = {
  data: PropTypes.array.isRequired,
};
