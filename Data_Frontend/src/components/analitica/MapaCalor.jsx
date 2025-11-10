import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography, Box } from "@mui/material";

export default function MapaCalor({ data }) {
  if (!data.length) return <Typography>No hay datos para mostrar</Typography>;

  const maxTemp = Math.max(...data.map(d => d.temperature || 0));
  const minTemp = Math.min(...data.map(d => d.temperature || 0));

  const getColor = (temp) => {
    if (temp == null) return "#ccc";
    const ratio = (temp - minTemp) / (maxTemp - minTemp || 1);
    const r = Math.floor(255 * ratio);
    const g = Math.floor(100 * (1 - ratio));
    const b = Math.floor(255 * (1 - ratio));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#000" }}>
          Mapa de Calor por Estación
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {data.map((d, i) => (
            <Box
              key={i}
              sx={{
                width: 60,
                height: 60,
                backgroundColor: getColor(d.temperature),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1,
                color: "#fff",
                fontSize: 12,
              }}
              title={`${d.station_name}: ${d.temperature ?? "N/A"}°C`}
            >
              {d.station_name?.slice(0, 3)}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

MapaCalor.propTypes = {
  data: PropTypes.array.isRequired,
};
