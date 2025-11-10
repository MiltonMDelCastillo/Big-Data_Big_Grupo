import React from "react";
import PropTypes from "prop-types"; // <-- IMPORTAR PropTypes
import { Card, CardContent, Button, Typography, Box } from "@mui/material";

export default function HerramientasAnalitica({ onExport }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4 }}>
      <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#000" }}>
          Herramientas de Analítica
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" color="primary" onClick={onExport}>
            Exportar CSV
          </Button>
          <Button variant="outlined" color="secondary">
            Descargar PDF
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// VALIDACIÓN DE PROPS
HerramientasAnalitica.propTypes = {
  onExport: PropTypes.func, // <-- declaramos que es una función opcional
};
