import React, { useState, useEffect } from "react";
// 🛑 Cambiamos de Line a Bar
import { Bar } from "react-chartjs-2"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, // 🛑 Usamos BarElement en lugar de PointElement/LineElement
  Title,
  Tooltip,
  Legend,
  // 🛑 Ya NO usamos TimeScale ni el adaptador de fechas
} from "chart.js";

import { 
    Card, CardContent, Box, Typography, CircularProgress, 
    Select, MenuItem, FormControl, InputLabel 
} from "@mui/material";

import './NiveldeSonido.css'; 

// ----------------------------------------------------
// 1. Registro de Componentes de Chart.js
// ----------------------------------------------------
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, // Registramos el elemento de barra
  Title,
  Tooltip,
  Legend
);

// ----------------------------------------------------
// 2. Función de Procesamiento: Calcula el Promedio por Sensor
// ----------------------------------------------------
/**
 * Procesa los datos brutos para agruparlos por sensor y calcular el LAeq promedio.
 */
function processDataForBarChart(rawData) {
    if (!rawData || rawData.length === 0) return { datasets: [] };

    const sensorSummaryMap = {};
    
    // 1. Acumular valores y contar registros por sensor
    rawData.forEach(record => {
        // Mapeo 1: Priorizar nombre legible
        let deviceName = record.device_name || record.dev_eui || record['Dev Eui'] || record['Application Name'];
        
        // Mapeo 2: Valor de la medición (LAeq)
        let laeqString = '';
        if (record.mediciones && typeof record.mediciones.laeq !== 'undefined') {
            laeqString = String(record.mediciones.laeq);
        } else if (record.Mediciones || record['Mediciones Laeq']) {
            laeqString = String(record.Mediciones || record['Mediciones Laeq']);
        }

        // Limpieza de valor
        if (typeof laeqString === 'string') {
            laeqString = laeqString.replace(',', '.').trim(); 
        }
        let laeqValue = parseFloat(laeqString);

        if (!deviceName || isNaN(laeqValue)) {
            return; 
        }

        if (!sensorSummaryMap[deviceName]) {
            sensorSummaryMap[deviceName] = { 
                sum: 0,
                count: 0
            };
        }

        sensorSummaryMap[deviceName].sum += laeqValue;
        sensorSummaryMap[deviceName].count += 1;
    });

    // 2. Calcular el promedio y preparar los datos del gráfico
    const deviceNames = Object.keys(sensorSummaryMap);
    const averageLAeqs = deviceNames.map(name => {
        const summary = sensorSummaryMap[name];
        // Calcular promedio: Suma / Cantidad
        return summary.count > 0 ? parseFloat((summary.sum / summary.count).toFixed(2)) : 0;
    });
    
    // Colores para las barras (cada barra puede tener un color)
    const backgroundColors = [
        'rgba(0, 71, 171, 0.8)',   // Azul oscuro
        'rgba(255, 99, 132, 0.8)', // Rojo
        'rgba(75, 192, 192, 0.8)', // Turquesa
        'rgba(108, 173, 233, 0.8)', // Azul claro
        'rgba(255, 159, 64, 0.8)',  // Naranja
        'rgba(92, 230, 92, 0.8)',   // Verde
        'rgba(153, 102, 255, 0.8)', // Púrpura
    ];
    
    const borderColors = [
        'rgb(0, 71, 171)',
        'rgb(255, 99, 132)',
        'rgb(75, 192, 192)',
        'rgb(108, 173, 233)',
        'rgb(255, 159, 64)',
        'rgb(92, 230, 92)',
        'rgb(153, 102, 255)',
    ];

    // Estructura final de datos para Chart.js (Gráfico de Barras)
    return {
        labels: deviceNames, // Eje X: Nombres de los sensores
        datasets: [{
            label: 'Nivel Promedio (LAeq)',
            data: averageLAeqs, // Eje Y: Valores promedios
            backgroundColor: deviceNames.map((_, i) => backgroundColors[i % backgroundColors.length]),
            borderColor: deviceNames.map((_, i) => borderColors[i % borderColors.length]),
            borderWidth: 1,
        }]
    };
}


// ----------------------------------------------------
// 3. Componente React Principal (NiveldeSonido)
// ----------------------------------------------------
function NiveldeSonido() {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [loading, setLoading] = useState(false);
  const [databaseType, setDatabaseType] = useState('MongoDB'); 

  const handleDatabaseChange = (event) => {
      setDatabaseType(event.target.value);
  };

  useEffect(() => {
    const dbTypeLower = databaseType ? databaseType.toLowerCase() : '';
    const isMongoDB = dbTypeLower.includes('mongo');
    
    if (!isMongoDB) {
        setChartData({ datasets: [] });
        setLoading(false);
        return;
    }

    const getMongoSoundApiUrl = () => {
        const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 
        // Endpoint de estadísticas para obtener todos los datos
        const endpoint = import.meta.env.VITE_MONGO_SONIDO_ENDPOINT || '/api/mongodb/stats/sensores-sonido'; 
        return baseApiUrl + endpoint;
    };

    const soundApiUrl = getMongoSoundApiUrl();

    const fetchSoundData = async () => {
      if (!soundApiUrl) {
          setChartData({ datasets: [] });
          setLoading(false);
          return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(soundApiUrl);
        if (!response.ok) {
             throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        const rawRecords = data.data || data; 
        
        // 🛑 Usar la nueva función de procesamiento para barras
        const processedData = processDataForBarChart(rawRecords); 

        setChartData(processedData);
      } catch (error) {
        console.error("Fallo al obtener datos de sonido:", error.message);
        setChartData({ datasets: [] });
      } finally {
        setLoading(false);
      }
    };

    if (isMongoDB) {
        fetchSoundData();
    }
    
  }, [databaseType]); 

  // Opciones del Gráfico (para Barras)
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      // 🛑 Título consistente con tu ejemplo
      title: { 
          display: true,
          text: 'Nivel de Sonido Promedio (LAeq)',
          font: { size: 18, weight: 'bold' }
      },
    },
    scales: {
        y: {
            title: { display: true, text: 'Nivel de Sonido Promedio (LAeq)' },
            min: 0, 
            max: 60, // Ajuste el máximo a 60 para que se vea el rango completo
        },
        x: {
            title: { display: true, text: 'Sensor (Device Name)' },
            // El eje X es de categorías (los nombres de los sensores)
            type: 'category', 
        }
    }
  };

  const hasData = chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0;

  // --- Renderizado ---
  return (
    <Card className="nivel-sonido-card" sx={{ mt: 3, borderRadius: 3 }}>
      <CardContent>
        {/* Encabezado y Selector de Base de Datos */}
        <Box className="nivel-sonido-header-container">
            {/* 🛑 Título Principal del Dashboard (no el del gráfico) */}
            <Typography variant="h6" className="nivel-sonido-header-title">
                1.1 Nivel de Sonido Promedio (LAeq)
            </Typography>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="db-selector-label">Base de Datos</InputLabel>
                <Select
                    labelId="db-selector-label"
                    value={databaseType}
                    label="Base de Datos"
                    onChange={handleDatabaseChange}
                    className="db-selector-input"
                >
                    <MenuItem value={"MongoDB"}>MongoDB</MenuItem>
                    <MenuItem value={"PostgreSQL"}>PostgreSQL</MenuItem>
                </Select>
            </FormControl>
        </Box>

        <Box className="nivel-sonido-chart-container"> 
            
            {/* Mensajes de estado (usan los nombres de clase únicos) */}
            {databaseType.toLowerCase() !== 'mongodb' && (
                <div className="nivel-sonido-restriction-message">
                    🛑 **Función Desactivada:** Este gráfico de sonido solo está disponible para la base de datos **MongoDB**.
                </div>
            )}

            {databaseType.toLowerCase() === 'mongodb' && loading && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                    <CircularProgress size={40} color="primary" />
                </Box>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && !hasData && (
                <div className="nivel-sonido-no-data-message">
                    🚨 **No hay datos de sonido disponibles.** Asegúrate de que:
                    <ul>
                        <li>El Backend esté activo y accesible.</li>
                        <li>Quitaste el límite de 10,000 registros en `server.js` (si tu DB es grande).</li>
                        <li>La colección 'sensores\_sonido' tenga datos con los campos 'device\_name' y 'mediciones.laeq'.</li>
                    </ul>
                </div>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && hasData && (
                // 🛑 Usamos el componente Bar para el gráfico de barras
                <Bar data={chartData} options={options} /> 
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default NiveldeSonido;