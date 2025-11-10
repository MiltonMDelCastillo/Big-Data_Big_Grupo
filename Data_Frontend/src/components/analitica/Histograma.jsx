import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography } from "@mui/material";
import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
} from "recharts";

export default function Histograma({ data }) {
  // Contar la frecuencia de las temperaturas
  const counts = {};
  data.forEach((d) => {
    const temp = d.temperature != null ? Math.round(d.temperature) : "N/A";
    counts[temp] = (counts[temp] || 0) + 1;
  });

  const chartData = Object.keys(counts).map((key) => ({
    temperature: key,
    count: counts[key],
  }));

  if (!chartData.length) return <Typography>No hay datos para mostrar</Typography>;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          Histograma de Temperaturas
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="temperature" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4b6cb7" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

Histograma.propTypes = {
  data: PropTypes.array.isRequired,
};
