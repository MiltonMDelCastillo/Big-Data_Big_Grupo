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

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}

export default function DashboardSensores({ mode = "both" }) {
  // mode puede ser: "table", "charts", o "both"
  const [databaseType, setDatabaseType] = useState("mongodb");
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState("sensores-soterreados");
  const [selectedPostgresTable, setSelectedPostgresTable] = useState("sensores_soterrados");

  const mongodbCollections = [
    { value: "sensores-soterreados", label: "Sensores Soterreados" }, // El backend acepta ambos nombres
    { value: "sensores-sonidos", label: "Sensores Sonidos" }, // El backend acepta ambos nombres
    { value: "sensores-calidad-aire", label: "Sensores Calidad Aire" },
  ];

  const postgresTables = [
    { value: "sensores_soterrados", label: "Sensores Soterrados" },
    { value: "sensores_sonido", label: "Sensores Sonido" },
    { value: "sensores_calidad_aire", label: "Sensores Calidad Aire" },
  ];

  const handleDatabaseChange = (event) => {
    setDatabaseType(event.target.value);
    setCurrentTab(0);
    // Resetear selecciones
    if (event.target.value === "mongodb") {
      setSelectedCollection("sensores-soterreados");
    } else {
      setSelectedPostgresTable("sensores_soterrados");
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const showTabs = mode === "both";
  const showTable = mode === "table" || mode === "both";
  const showCharts = mode === "charts" || mode === "both";

  // Si solo hay una vista, establecer el tab correcto
  React.useEffect(() => {
    if (mode === "charts") {
      setCurrentTab(1);
    } else if (mode === "table") {
      setCurrentTab(0);
    }
  }, [mode]);

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

      {showTable && (
        <TabPanel value={currentTab} index={0} forceShow={mode === "table"}>
          <TablaSensores
            databaseType={databaseType}
            collection={databaseType === "mongodb" ? selectedCollection : selectedPostgresTable}
          />
        </TabPanel>
      )}

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
