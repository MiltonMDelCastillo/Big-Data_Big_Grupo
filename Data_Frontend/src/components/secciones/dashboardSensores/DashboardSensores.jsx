import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import TabPanel from "./TabPanel";
import TablaSensores from "./TablaSensores";
import GraficosSensores from "./GraficosSensores";
import "./DashboardSensores.css";

// Función de accesibilidad para las pestañas (Tabs) de Material-UI.
// Asocia cada pestaña con su panel de contenido correspondiente para lectores de pantalla.
function a11yProps(index) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}
/**
 * Componente principal del Dashboard de Sensores.
 * Permite al usuario seleccionar una base de datos (MongoDB o PostgreSQL) y una colección/tabla.
 * Muestra los datos en una tabla y/o en gráficos, dependiendo del modo de visualización.
 * @param {object} props - Propiedades del componente.
 * @param {string} [props.mode="both"] - El modo de visualización. Puede ser "table", "charts", o "both".
 */
export default function DashboardSensores({ mode = "both" }) {
  // --- ESTADOS DEL COMPONENTE ---

  // Estado para almacenar el tipo de base de datos seleccionada ('mongodb' o 'postgresql').
  const [databaseType, setDatabaseType] = useState("mongodb");
  // Estado para controlar la pestaña activa (0 para Tabla, 1 para Gráficos).
  const [currentTab, setCurrentTab] = useState(0);
  // Estado para la colección de MongoDB seleccionada.
  const [selectedCollection, setSelectedCollection] = useState("sensores-soterreados");
  // Estado para la tabla de PostgreSQL seleccionada.
  const [selectedPostgresTable, setSelectedPostgresTable] = useState("sensores_soterrados");

  // --- CONFIGURACIÓN DE DATOS ---

  // Define las colecciones disponibles en MongoDB para el selector.
  // Los valores coinciden con las rutas de la API del backend.
  const mongodbCollections = [
    { value: "sensores-soterreados", label: "Sensores Soterreados" }, // El backend acepta ambos nombres
    { value: "sensores-sonidos", label: "Sensores Sonidos" }, // El backend acepta ambos nombres
    { value: "sensores-calidad-aire", label: "Sensores Calidad Aire" },
  ];

  // Define las tablas disponibles en PostgreSQL para el selector.
  // Los valores coinciden con los nombres de las tablas en la base de datos.
  const postgresTables = [
    { value: "sensores_soterrados", label: "Sensores Soterrados" },
    { value: "sensores_sonido", label: "Sensores Sonido" },
    { value: "sensores_calidad_aire", label: "Sensores Calidad Aire" },
  ];

  // --- MANEJADORES DE EVENTOS ---

  // Se ejecuta cuando el usuario cambia la base de datos en el selector.
  const handleDatabaseChange = (event) => {
    setDatabaseType(event.target.value);
    setCurrentTab(0);
    // Al cambiar de BD, resetea la selección de colección/tabla a la primera opción.
    if (event.target.value === "mongodb") {
      setSelectedCollection("sensores-soterreados");
    } else {
      setSelectedPostgresTable("sensores_soterrados");
    }
  };

  // Se ejecuta cuando el usuario hace clic en una pestaña (Tabla o Gráficos).
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // --- LÓGICA DE RENDERIZADO CONDICIONAL ---

  // Determina si se deben mostrar las pestañas de navegación.
  const showTabs = mode === "both";
  // Determina si se debe renderizar el componente de la tabla.
  const showTable = mode === "table" || mode === "both";
  // Determina si se debe renderizar el componente de los gráficos.
  const showCharts = mode === "charts" || mode === "both";

  // Hook de efecto para ajustar la pestaña activa si el modo no es "both".
  React.useEffect(() => {
    if (mode === "charts") {
      setCurrentTab(1);
    } else if (mode === "table") {
      setCurrentTab(0);
    }
  }, [mode]);

  // --- RENDERIZADO DEL COMPONENTE ---

  return (
    <Box className="dashboard-sensores-container">
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#000" }}>
              Dashboard de Sensores
            </Typography>

            {/* Selector para elegir la base de datos */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Base de Datos</InputLabel>
              <Select
                value={databaseType}
                label="Base de Datos"
                onChange={handleDatabaseChange}
              >
                <MenuItem value="mongodb">MongoDB</MenuItem>
                <MenuItem value="postgresql">PostgreSQL</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Selector de colecciones de MongoDB (se muestra solo si la BD es mongodb) */}
          {databaseType === "mongodb" && (
            <Box sx={{ mt: 2 }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Colección</InputLabel>
                <Select
                  value={selectedCollection}
                  label="Colección"
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  {mongodbCollections.map((col) => (
                    <MenuItem key={col.value} value={col.value}>
                      {col.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Selector de tablas de PostgreSQL (se muestra solo si la BD es postgresql) */}
          {databaseType === "postgresql" && (
            <Box sx={{ mt: 2 }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Tabla</InputLabel>
                <Select
                  value={selectedPostgresTable}
                  label="Tabla"
                  onChange={(e) => setSelectedPostgresTable(e.target.value)}
                >
                  {postgresTables.map((table) => (
                    <MenuItem key={table.value} value={table.value}>
                      {table.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Pestañas de navegación (se muestran solo si el modo es "both") */}
          {showTabs && (
            <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                aria-label="tabs de sensores"
              >
                <Tab label="Tabla de Datos" {...a11yProps(0)} />
                <Tab label="Gráficos" {...a11yProps(1)} />
              </Tabs>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Panel que contiene la tabla de sensores */}
      {showTable && (
        <TabPanel value={currentTab} index={0} forceShow={mode === "table"}>
          <TablaSensores
            databaseType={databaseType}
            collection={databaseType === "mongodb" ? selectedCollection : selectedPostgresTable}
          />
        </TabPanel>
      )}

      {/* Panel que contiene los gráficos de los sensores */}
      {showCharts && (
        <TabPanel value={currentTab} index={1} forceShow={mode === "charts"}>
          <GraficosSensores
            databaseType={databaseType}
            collection={databaseType === "mongodb" ? selectedCollection : selectedPostgresTable}
          />
        </TabPanel>
      )}
    </Box>
  );
}
