// DiagramaPredicciones.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DiagramaPredicciones({ data }) {
  const [modo, setModo] = useState("normal"); // suave | normal | agresiva
  const [futuro, setFuturo] = useState(5); // puntos a predecir

  const campos = [
    { key: "temperature", label: "Temperatura (°C)" },
    { key: "humidity", label: "Humedad (%)" },
    { key: "pressure", label: "Presión (hPa)" },
  ];

  // Función para generar datos con predicción usando varios puntos según modo
  const generarChartData = (campo) => {
    const valores = data.map((d) => d[campo]).filter((v) => v != null);
    if (!valores.length) return [];

    // Determinar cuántos puntos usar según el modo
    const puntosModo = (() => {
      switch (modo) {
        case "suave":
          return Math.min(5, valores.length);
        case "normal":
          return Math.min(10, valores.length);
        case "agresiva":
          return Math.min(15, valores.length);
        default:
          return 5;
      }
    })();

    // Calcular pendiente promedio de los últimos N puntos
    const pendientePromedio = (() => {
      if (valores.length < 2) return 0;
      const start = valores.length - puntosModo;
      let sumaPendientes = 0;
      let count = 0;
      for (let i = start; i < valores.length - 1; i++) {
        if (i >= 0) {
          sumaPendientes += valores[i + 1] - valores[i];
          count++;
        }
      }
      return count > 0 ? sumaPendientes / count : 0;
    })();

    // Generar predicciones
    const predicciones = Array.from({ length: futuro }, (_, i) => ({
      index: valores.length + i,
      predicted: valores[valores.length - 1] + pendientePromedio * (i + 1),
    }));

    // Datos históricos + predicciones
    return [...valores.map((v, i) => ({ index: i, real: v })), ...predicciones];
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#fffefeff", textAlign: "center" }}>
        Diagrama de Predicción
      </Typography>

      {/* Controles globales */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center", // centrado horizontal
          alignItems: "center",     // centrado vertical
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          size="small"
          sx={{
            minWidth: 120,
            bgcolor: "rgba(255, 255, 255, 0.15)", // fondo semitransparente
            borderRadius: 2,
            boxShadow: 1,
            color: "#fff", // texto visible
            "& .MuiSelect-icon": { color: "#fff" }, // flecha visible
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            "&.Mui-focused": { bgcolor: "rgba(255, 255, 255, 0.25)" },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fff",
            },
          }}
        >
          <MenuItem value="suave">Suave</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="agresiva">Agresiva</MenuItem>
        </Select>


        <TextField
          type="number"
          size="small"
          label="Puntos a predecir"
          value={futuro}
          onChange={(e) =>
            setFuturo(Math.max(1, Math.min(20, parseInt(e.target.value))))
          }
          InputLabelProps={{
            style: { color: "#fff", fontWeight: 500 }, // label visible
          }}
          inputProps={{
            style: { color: "#fff", fontWeight: 500 }, // texto dentro del input
          }}
          sx={{
            width: 150,
            bgcolor: "rgba(255, 255, 255, 0.15)", // fondo semitransparente
            borderRadius: 2,
            boxShadow: 1,
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.6)" },
              "&.Mui-focused fieldset": { borderColor: "#fff" },
            },
          }}
        />

      </Box>


      {/* Gráficos en fila */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {campos.map((c) => {
          const chartData = generarChartData(c.key);
          return (
            <Card
              key={c.key}
              sx={{ flex: 1, minWidth: 300, borderRadius: 3, boxShadow: 4 }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {c.label}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="index" stroke="#333" />
                    <YAxis stroke="#333" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                      }}
                    />
                    {/* Línea datos reales */}
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke="#1565c0"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    {/* Línea predicción */}
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#ff9800"
                      strokeDasharray="5 5"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

DiagramaPredicciones.propTypes = {
  data: PropTypes.array.isRequired,
};
