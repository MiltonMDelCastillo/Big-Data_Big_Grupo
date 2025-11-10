import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SerieTiempo({ data }) {
  const chartData = data.map(d => ({
    time: new Date(d.time).toLocaleTimeString(),
    temperature: d.temperature,
  }));

  if (!chartData.length) return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          Serie de Tiempo de Temperatura
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperature" stroke="#4b6cb7" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

SerieTiempo.propTypes = {
  data: PropTypes.array.isRequired,
};
