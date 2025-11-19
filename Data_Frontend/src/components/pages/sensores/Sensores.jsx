import React from "react";
import { Box, Card, CardContent, Typography, Grid, Chip } from "@mui/material";
import { Activity, Database, BarChart3, MapPin, Wifi, Battery } from "lucide-react";
import "./Sensores.css";

const Sensores = () => {
  const features = [
    {
      icon: <Database size={40} />,
      title: "Dual Database",
      description: "Conecta con MongoDB y PostgreSQL simultáneamente",
      color: "#667eea",
    },
    {
      icon: <BarChart3 size={40} />,
      title: "Visualización Avanzada",
      description: "Gráficos interactivos con múltiples tipos de visualización",
      color: "#f093fb",
    },
    {
      icon: <MapPin size={40} />,
      title: "Monitoreo en Tiempo Real",
      description: "Seguimiento de sensores distribuidos en la ciudad",
      color: "#4facfe",
    },
    {
      icon: <Activity size={40} />,
      title: "Análisis de Datos",
      description: "Análisis profundo de mediciones de sensores IoT",
      color: "#43e97b",
    },
    {
      icon: <Wifi size={40} />,
      title: "Red LoRa",
      description: "Monitoreo de calidad de señal y conectividad",
      color: "#fa709a",
    },
    {
      icon: <Battery size={40} />,
      title: "Estado de Sensores",
      description: "Control de batería y estado de dispositivos",
      color: "#fee140",
    },
  ];

  const sensorTypes = [
    {
      name: "Sensores Soterreados",
      description: "Monitorean el nivel de agua en tanques de almacenamiento",
      metric: "Distancia (cm)",
      icon: "💧",
    },
    {
      name: "Sensores de Sonido",
      description: "Miden niveles de ruido ambiental en decibeles",
      metric: "LAeq (dB)",
      icon: "🔊",
    },
    {
      name: "Sensores de Calidad Aire",
      description: "Detectan CO2, temperatura, humedad y presión",
      metric: "CO2 (ppm)",
      icon: "🌬️",
    },
  ];

  return (
    <Box className="sensores-page">
      <Box className="sensores-hero">
        <Typography variant="h1" className="sensores-title">
          Aplicación de Monitoreo de Sensores
        </Typography>
        <Typography variant="h5" className="sensores-subtitle">
          Sistema integral para visualización y análisis de datos de sensores IoT
        </Typography>
      </Box>

      <Box sx={{ p: 4 }}>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: 6,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 12,
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ borderRadius: 3, boxShadow: 6, mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}>
              Tipos de Sensores Monitoreados
            </Typography>
            <Grid container spacing={3}>
              {sensorTypes.map((sensor, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      p: 3,
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 2, textAlign: "center" }}>
                      {sensor.icon}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
                      {sensor.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, textAlign: "center" }}>
                      {sensor.description}
                    </Typography>
                    <Chip
                      label={sensor.metric}
                      sx={{
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontWeight: 600,
                        display: "block",
                        mx: "auto",
                      }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}>
              Características Principales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Visualización en tiempo real de datos de sensores</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Gráficos interactivos con múltiples tipos de visualización</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Filtrado y búsqueda avanzada de datos</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Exportación de datos en formato CSV</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Soporte para múltiples bases de datos</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Chip label="✓" color="success" />
                  <Typography>Interfaz intuitiva y moderna</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Sensores;

