import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2"; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { 
    Card, CardContent, Box, Typography, CircularProgress, 
    Select, MenuItem, FormControl, InputLabel 
} from "@mui/material";

// 🛑 Importar el CSS con el nombre de clase único
import './Distribucion.css'; 

// ----------------------------------------------------
// 1. Registro de Componentes de Chart.js
// ----------------------------------------------------
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ----------------------------------------------------
// 2. Función de Procesamiento: Calcula el Máximo Nivel por Sensor
// ----------------------------------------------------
/**
 * Procesa los datos brutos para agruparlos por sensor y calcular el LAeq máximo.
 */
function processDataForDistribution(rawData) {
    if (!rawData || rawData.length === 0) return { datasets: [] };

    const sensorMaxMap = {};
    
    // 1. Acumular valores y encontrar el máximo por sensor
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

        // Encontrar el valor máximo
        if (typeof sensorMaxMap[deviceName] === 'undefined' || laeqValue > sensorMaxMap[deviceName]) {
            sensorMaxMap[deviceName] = laeqValue;
        }
    });

    // 2. Preparar los datos del gráfico
    const deviceNames = Object.keys(sensorMaxMap);
    const maxLAeqs = deviceNames.map(name => parseFloat(sensorMaxMap[name].toFixed(2)));
    
    // Colores para las barras
    const backgroundColors = [
        'rgba(0, 71, 171, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75, 192, 192, 0.8)', 
        'rgba(108, 173, 233, 0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(92, 230, 92, 0.8)',
    ];
    
    const borderColors = [
        'rgb(0, 71, 171)', 'rgb(255, 99, 132)', 'rgb(75, 192, 192)', 
        'rgb(108, 173, 233)', 'rgb(255, 159, 64)', 'rgb(92, 230, 92)',
    ];

    // Estructura final de datos para Chart.js
    return {
        labels: deviceNames, // Eje X: Nombres de los sensores
        datasets: [{
            label: 'Máximo Nivel (LAeq)',
            data: maxLAeqs, // Eje Y: Valores máximos
            backgroundColor: deviceNames.map((_, i) => backgroundColors[i % backgroundColors.length]),
            borderColor: deviceNames.map((_, i) => borderColors[i % borderColors.length]),
            borderWidth: 1,
        }]
    };
}


// ----------------------------------------------------
// 3. Componente React Principal (Distribucion)
// ----------------------------------------------------
function Distribucion() {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [loading, setLoading] = useState(false);
  const [databaseType, setDatabaseType] = useState('MongoDB'); 

  const handleDatabaseChange = (event) => {
      setDatabaseType(event.target.value);
  };

  // 🛑 Lógica de Fetch de Datos (similar a NiveldeSonido.jsx)
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
        
        // 🛑 Usar la función de procesamiento para Distribución (Máximo)
        const processedData = processDataForDistribution(rawRecords); 

        setChartData(processedData);
      } catch (error) {
        console.error("Fallo al obtener datos de distribución de sonido:", error.message);
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
      title: { 
          display: false, // El título principal va en el encabezado de la tarjeta
      },
    },
    scales: {
        y: {
            title: { display: true, text: 'Máximo Nivel de Sonido (LAeq)' },
            min: 0, 
            max: 80, // Rango típico de ruido
        },
        x: {
            title: { display: true, text: 'Sensor (Device Name)' },
            type: 'category', 
        }
    }
  };

  const hasData = chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0;

  // --- Renderizado ---
  return (
    // 🛑 Clase única para la tarjeta
    <Card className="distribucion-card" sx={{ mt: 3, borderRadius: 3 }}>
      <CardContent>
        {/* Encabezado y Selector de Base de Datos */}
        {/* 🛑 Clase única para el contenedor */}
        <Box className="distribucion-header-container"> 
            {/* 🛑 Clase única y Título correcto */}
            <Typography variant="h6" className="distribucion-header-title">
                1.2 Distribución del Nivel de Sonido por Sensor
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

        {/* 🛑 Clase única para el contenedor del gráfico */}
        <Box className="distribucion-chart-container"> 
            
            {/* Mensajes de estado (usan los nombres de clase únicos) */}
            {databaseType.toLowerCase() !== 'mongodb' && (
                <div className="distribucion-restriction-message">
                    🛑 **Función Desactivada:** Este gráfico de distribución solo está disponible para **MongoDB**.
                </div>
            )}

            {databaseType.toLowerCase() === 'mongodb' && loading && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                    <CircularProgress size={40} color="primary" />
                </Box>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && !hasData && (
                <div className="distribucion-no-data-message">
                    🚨 **No hay datos disponibles.** Asegúrate de:
                    <ul>
                        <li>El Backend esté activo.</li>
                        <li>Quitaste el límite de 10,000 registros en `server.js`.</li>
                        <li>La colección 'sensores\_sonido' tenga datos válidos.</li>
                    </ul>
                </div>
            )}
            
            {databaseType.toLowerCase() === 'mongodb' && !loading && hasData && (
                // 🛑 Usamos el componente Bar
                <Bar data={chartData} options={options} /> 
            )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default Distribucion;