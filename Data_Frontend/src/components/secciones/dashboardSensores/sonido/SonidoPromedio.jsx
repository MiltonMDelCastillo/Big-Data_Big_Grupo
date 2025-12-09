import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // 🛑 ESENCIAL PARA EL EJE X DE TIEMPO
} from "chart.js";
// 🛑 LIBRERÍA INSTALADA EN EL PASO ANTERIOR
import 'chartjs-adapter-date-fns'; 

import { 
    Card, CardContent, Box, Typography, CircularProgress, 
    Select, MenuItem, FormControl, InputLabel 
} from "@mui/material";

import './SonidoPromedio.css'; 

// ----------------------------------------------------
// 1. Registro de Componentes de Chart.js
// ----------------------------------------------------
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale 
);

// ----------------------------------------------------
// 2. Función de Procesamiento: Agrupa datos crudos por Sensor
// ----------------------------------------------------
function processDataBySensor(rawData) {
    if (!rawData || rawData.length === 0) return { datasets: [] };

    const sensorDataMap = {};
    
    const defaultColors = [
        'rgb(0, 71, 171)', 'rgb(255, 99, 132)', 'rgb(75, 192, 192)', 
        'rgb(108, 173, 233)', 'rgb(255, 159, 64)', 'rgb(92, 230, 92)',
        'rgb(153, 102, 255)', 'rgb(255, 99, 132)', 'rgb(54, 162, 235)'
    ];
    let colorIndex = 0;

    rawData.forEach(record => {
        // 🛑 Mapeo 1: Priorizar nombre legible
        let deviceName = record.device_name || record.dev_eui || record['Dev Eui'] || record['Application Name'];
        
        // 🛑 Mapeo 2: Timestamp
        let timestamp = record.timestamp?.$date || record.ts_medicion || record.timestamp;
        
        // 🛑 Mapeo 3: Valor de la medición (LAeq)
        let laeqString = '';
        
        if (record.mediciones && typeof record.mediciones.laeq !== 'undefined') {
            // Caso A: Datos de PostgreSQL o MongoDB transformados
            laeqString = String(record.mediciones.laeq);
        } else if (record.Mediciones || record['Mediciones Laeq']) {
             // Caso B: Datos crudos de MongoDB sin transformar
            laeqString = String(record.Mediciones || record['Mediciones Laeq']);
        }

        // Limpieza de valor
        if (typeof laeqString === 'string') {
            laeqString = laeqString.replace(',', '.').trim(); 
        }
        let laeqValue = parseFloat(laeqString);


        // 🛑 VALIDACIÓN REFORZADA: Si falta algún campo crítico, lo descartamos.
        if (!deviceName || !timestamp || isNaN(new Date(timestamp)) || isNaN(laeqValue)) {
            // console.warn("Registro descartado (datos incompletos/inválidos):", record);
            return; 
        }

        if (!sensorDataMap[deviceName]) {
            sensorDataMap[deviceName] = { 
                data: [], 
                color: defaultColors[colorIndex % defaultColors.length]
            };
            colorIndex++;
        }

        sensorDataMap[deviceName].data.push({
            x: new Date(timestamp), // Convertir a objeto Date
            y: laeqValue,
        });
    });

    const datasets = Object.keys(sensorDataMap).map(deviceName => {
        const sensorData = sensorDataMap[deviceName];
        const sortedData = sensorData.data.sort((a, b) => a.x - b.x);

        return {
            label: deviceName,
            data: sortedData,
            borderColor: sensorData.color,
            backgroundColor: sensorData.color, 
            tension: 0.1,
            fill: false, 
            pointRadius: 2,
            pointHoverRadius: 4,
            showLine: true,
        };
    });
    
    return { datasets };
}

// ----------------------------------------------------
// 3. Componente React Principal
// ----------------------------------------------------
function SonidoPromedio() {
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
        // Usamos el endpoint de estadísticas para obtener todos los datos
        const endpoint = import.meta.env.VITE_MONGO_SONIDO_ENDPOINT || '/api/mongodb/stats/sensores-sonido'; 
        
        if (!baseApiUrl) {
             return '';
        }
        
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
        // Verificar si la respuesta fue exitosa antes de parsear JSON
        if (!response.ok) {
             throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        const rawRecords = data.data || data; 
        const processedData = processDataBySensor(rawRecords); 

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

  // Opciones del Gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
        y: {
            title: { display: true, text: 'Nivel de Sonido (LAeq)' },
            min: 20, 
            max: 80, 
        },
        x: {
            title: { display: true, text: 'Fecha' },
            type: 'time', 
            time: {
                unit: 'day', 
                displayFormats: {
                    day: 'MMM d' 
                },
                tooltipFormat: 'MMM d, h:mm:ss a' 
            },
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
        }
    }
  };

  const hasData = chartData.datasets.length > 0 && chartData.datasets.some(d => d.data.length > 0);

  // --- Renderizado ---
  return (
    <Card className="sonido-card" sx={{ mt: 3, borderRadius: 3 }}>
      <CardContent>
        {/* Encabezado y Selector de Base de Datos */}
        <Box className="header-container">
            <Typography variant="h6" className="header-title">
                1.1 Evolución del Nivel de Sonido (LAeq)
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

        <Box className="chart-container">
            
            {/* Mensajes de estado */}
            {databaseType.toLowerCase() !== 'mongodb' && (
                <div className="db-restriction-message">
                    🛑 **Función Desactivada:** Este gráfico de sonido solo está disponible para la base de datos **MongoDB**.
                </div>
            )}

            {databaseType.toLowerCase() === 'mongodb' && loading && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                    <CircularProgress size={40} color="primary" />
                </Box>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && !hasData && (
                <div className="no-data-message">
                    🚨 **No hay datos de sonido disponibles.** Esto puede deberse a:
                    <ul>
                        <li>El Backend no está corriendo o la URL es incorrecta.</li>
                        <li>**La colección 'sensores\_sonido' está vacía.**</li>
                        <li>Los datos recibidos no contienen el campo 'device\_name' o 'mediciones.laeq' con valores válidos.</li>
                    </ul>
                </div>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && hasData && (
                <Line data={chartData} options={options} /> 
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default SonidoPromedio;