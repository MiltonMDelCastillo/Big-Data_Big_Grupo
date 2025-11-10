import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DiagramaPrediccion({ data }) {
  const chartData = data.map((d,i) => ({
    index: i,
    temperature: d.temperature,
    predicted: d.temperature != null ? d.temperature * 1.02 : null, // ejemplo simple
  }));

  if (!chartData.length) return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          Diagrama de Predicciones
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperature" stroke="#4b6cb7" />
            <Line type="monotone" dataKey="predicted" stroke="#ff9800" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

DiagramaPrediccion.propTypes = {
  data: PropTypes.array.isRequired,
};
