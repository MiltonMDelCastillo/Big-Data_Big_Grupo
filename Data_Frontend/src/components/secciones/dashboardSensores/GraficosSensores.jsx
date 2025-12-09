import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const API_BASE = "http://localhost:5000";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

const chartTypes = [
  { value: "line", label: "Línea" },
  { value: "bar", label: "Barras" },
  { value: "pie", label: "Pastel" },
  { value: "area", label: "Área" },
  { value: "scatter", label: "Dispersión" },
  { value: "composed", label: "Combinado" },
];

// Función unificada para transformar datos (MongoDB y PostgreSQL)
const transformData = (rawData, collectionType) => {
  if (!rawData || rawData.length === 0) return [];

  return rawData
    .map((d) => {
      // Extraer timestamp de forma unificada
      let timestamp = null;
      if (d.timestamp?.$date) {
        timestamp = new Date(d.timestamp.$date);
      } else if (d.timestamp) {
        timestamp = new Date(d.timestamp);
      } else if (d.ts_medicion) {
        timestamp = new Date(d.ts_medicion);
      }

      // Formatear fecha de forma consistente
      const dateStr = timestamp ? timestamp.toLocaleDateString("es-ES", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric" 
      }) : "";

      // Extraer mediciones de forma unificada
      const mediciones = d.mediciones || {};

      // Construir objeto base
      const base = {
        deviceName: d.device_name || "Sin nombre",
        name: d.device_name || "Sin nombre",
        address: d.address || "",
        timestamp: timestamp || new Date(),
        date: dateStr,
      };

      // Agregar métricas según el tipo de colección
      if (collectionType === "soterrados") {
        return {
          ...base,
          distance: parseFloat(mediciones.distance) || 0,
          battery: parseFloat(mediciones.battery) || 0,
        };
      } else if (collectionType === "sonido") {
        return {
          ...base,
          laeq: parseFloat(mediciones.laeq) || 0,
          lai: parseFloat(mediciones.lai) || 0,
          lai_max: parseFloat(mediciones.lai_max) || 0,
          battery: parseFloat(mediciones.battery) || 0,
        };
      } else if (collectionType === "calidad-aire") {
        return {
          ...base,
          co2: parseFloat(mediciones.co2) || 0,
          temperature: parseFloat(mediciones.temperature) || 0,
          humidity: parseFloat(mediciones.humidity) || 0,
          pressure: parseFloat(mediciones.pressure) || 0,
          battery: parseFloat(mediciones.battery) || 0,
        };
      }

      return base;
    })
    .filter((d) => {
      // Filtrar según el tipo de colección
      if (collectionType === "soterrados") {
        return d.distance !== null && d.distance !== undefined && d.distance > 0;
      } else if (collectionType === "sonido") {
        return d.laeq !== null && d.laeq !== undefined && d.laeq > 0;
      } else if (collectionType === "calidad-aire") {
        return d.co2 !== null && d.co2 !== undefined && d.co2 > 0;
      }
      return true;
    });
};

export default function GraficosSensores({ databaseType, collection }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("line");
  const [selectedMetric, setSelectedMetric] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = "";
        if (databaseType === "mongodb" && collection) {
          url = `${API_BASE}/api/mongodb/stats/${collection}`;
        } else if (databaseType === "postgresql" && collection) {
          url = `${API_BASE}/api/postgresql/stats/${collection}`;
        } else {
          setData([]);
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        const rawData = json.data || [];

        // Determinar el tipo de colección
        let collectionType = "";
        if (collection.includes("soterread") || collection.includes("soterrado")) {
          collectionType = "soterrados";
        } else if (collection.includes("sonido") || collection.includes("sonidos")) {
          collectionType = "sonido";
        } else if (collection.includes("calidad") || collection.includes("aire")) {
          collectionType = "calidad-aire";
        }

        // Transformar datos usando función unificada
        const transformedData = transformData(rawData, collectionType);

        // Ordenar por timestamp
        transformedData.sort((a, b) => a.timestamp - b.timestamp);

        // Establecer métrica por defecto
        if (transformedData.length > 0 && !selectedMetric) {
          const firstRow = transformedData[0];
          if (collectionType === "soterrados") {
            setSelectedMetric("distance");
          } else if (collectionType === "sonido") {
            setSelectedMetric("laeq");
          } else if (collectionType === "calidad-aire") {
            setSelectedMetric("co2");
          }
        }

        setData(transformedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setData([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [databaseType, collection]);

  const getAvailableMetrics = () => {
    if (data.length === 0) return [];
    const sample = data[0];
    const metrics = Object.keys(sample).filter(
      (key) => typeof sample[key] === "number" && !["id", "timestamp"].includes(key)
    );
    return metrics;
  };

  // Agrupar datos por dispositivo para gráficos de líneas múltiples
  const groupDataByDevice = () => {
    if (!selectedMetric) return [];
    
    const grouped = {};
    data.forEach((d) => {
      const device = d.deviceName || d.name;
      if (!grouped[device]) {
        grouped[device] = [];
      }
      grouped[device].push({
        date: d.date || d.timestamp?.toLocaleDateString() || "",
        timestamp: d.timestamp,
        value: d[selectedMetric] || 0,
        deviceName: device,
      });
    });

    // Convertir a array de series
    return Object.keys(grouped).map((device) => ({
      deviceName: device,
      data: grouped[device].sort((a, b) => a.timestamp - b.timestamp),
    }));
  };

  // Preparar datos para gráficos de barras agrupadas por dispositivo
  const prepareBarChartData = () => {
    if (!selectedMetric) return [];
    
    const deviceAverages = {};
    data.forEach((d) => {
      const device = d.deviceName || d.name;
      if (!deviceAverages[device]) {
        deviceAverages[device] = { sum: 0, count: 0, deviceName: device };
      }
      deviceAverages[device].sum += d[selectedMetric] || 0;
      deviceAverages[device].count += 1;
    });

    return Object.keys(deviceAverages).map((device) => ({
      name: device,
      [selectedMetric]: deviceAverages[device].count > 0 
        ? deviceAverages[device].sum / deviceAverages[device].count 
        : 0,
    }));
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (data.length === 0) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No hay datos para mostrar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Verifica que la base de datos tenga datos en la colección/tabla seleccionada
          </Typography>
        </Box>
      );
    }

    const metrics = getAvailableMetrics();
    const metric = selectedMetric || metrics[0] || "value";

    if (!metrics.includes(metric)) {
      setSelectedMetric(metrics[0] || "");
      return null;
    }

    switch (chartType) {
      case "line":
        const lineSeries = groupDataByDevice();
        if (lineSeries.length > 0) {
          // Crear un mapa de todas las fechas únicas
          const allDates = new Set();
          lineSeries.forEach((series) => {
            series.data.forEach((point) => allDates.add(point.date));
          });
          const sortedDates = Array.from(allDates).sort();

          // Preparar datos para el gráfico
          const lineChartData = sortedDates.map((date) => {
            const point = { date };
            lineSeries.forEach((series) => {
              const dataPoint = series.data.find((d) => d.date === date);
              point[series.deviceName] = dataPoint ? dataPoint.value : null;
            });
            return point;
          });

          return (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="line"
                />
                {lineSeries.slice(0, 8).map((series, index) => (
                  <Line
                    key={series.deviceName}
                    type="monotone"
                    dataKey={series.deviceName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    name={series.deviceName}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        }
        break;

      case "bar":
        const barData = prepareBarChartData();
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
              />
              <Legend />
              <Bar 
                dataKey={metric} 
                fill="#8884d8"
                radius={[8, 8, 0, 0]}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        const pieData = prepareBarChartData().slice(0, 10).map((d) => ({
          name: d.name,
          value: d[metric] || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        const areaSeries = groupDataByDevice();
        if (areaSeries.length > 0) {
          const allDates = new Set();
          areaSeries.forEach((series) => {
            series.data.forEach((point) => allDates.add(point.date));
          });
          const sortedDates = Array.from(allDates).sort();

          const areaChartData = sortedDates.map((date) => {
            const point = { date };
            areaSeries.forEach((series) => {
              const dataPoint = series.data.find((d) => d.date === date);
              point[series.deviceName] = dataPoint ? dataPoint.value : null;
            });
            return point;
          });

          return (
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart data={areaChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <Legend />
                {areaSeries.slice(0, 8).map((series, index) => (
                  <Area
                    key={series.deviceName}
                    type="monotone"
                    dataKey={series.deviceName}
                    stackId="1"
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.6}
                    name={series.deviceName}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          );
        }
        break;

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey={metric}
                label={{ value: metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Legend />
              <Scatter 
                name={metric} 
                data={data.slice(0, 100)} 
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "composed":
        const composedData = prepareBarChartData();
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={composedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: metric.toUpperCase(), angle: -90, position: "insideLeft" }}
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
              />
              <Legend />
              <Bar dataKey={metric} fill="#8884d8" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey={metric} stroke="#ff7300" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <Typography>Tipo de gráfico no soportado</Typography>;
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 6 }}>
        <Typography variant="h6" color="text.secondary">
          No se pueden generar gráficos con los datos disponibles
        </Typography>
      </Box>
    );
  };

  const metrics = getAvailableMetrics();

  return (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Tipo de Gráfico</InputLabel>
              <Select
                value={chartType}
                label="Tipo de Gráfico"
                onChange={(e) => setChartType(e.target.value)}
              >
                {chartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {metrics.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Métrica</InputLabel>
                <Select
                  value={selectedMetric || metrics[0]}
                  label="Métrica"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metrics.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {metric.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {renderChart()}
        </CardContent>
      </Card>
    </Box>
  );
}
