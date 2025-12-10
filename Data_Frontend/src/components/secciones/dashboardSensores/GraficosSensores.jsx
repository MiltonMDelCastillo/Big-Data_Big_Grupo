import React, { useState, useEffect, useMemo } from "react";
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
  ReferenceLine,
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

const predictionOptions = [
  { value: 0, label: "Sin predicción" },
  { value: 1, label: "1 día" },
  { value: 7, label: "1 semana" },
  { value: 30, label: "1 mes" },
  { value: 365, label: "1 año" },
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
        ts: timestamp ? timestamp.getTime() : Date.now(),
        label: timestamp
          ? timestamp.toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : dateStr,
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
  const [predictionHorizon, setPredictionHorizon] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = "";
        if (databaseType === "mongodb" && collection) {
          // Usar datos crudos para mayor variabilidad
          url = `${API_BASE}/api/mongodb/${collection}?page=1&limit=500`;
        } else if (databaseType === "postgresql" && collection) {
          url = `${API_BASE}/api/postgresql/${collection}?page=1&limit=500`;
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
          if (collectionType === "soterrados") {
            setSelectedMetric("distance");
          } else if (collectionType === "sonido") {
            setSelectedMetric("lai_max");
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
    const interval = setInterval(fetchData, 120000); // refresco automático cada 2 minutos
    return () => clearInterval(interval);
  }, [databaseType, collection, selectedMetric]);

  const getAvailableMetrics = () => {
    if (data.length === 0) return [];
    const sample = data[0];
    const metrics = Object.keys(sample).filter(
      (key) => typeof sample[key] === "number" && !["id", "timestamp"].includes(key)
    );
    return metrics;
  };

  // Agrupar datos por dispositivo; promediamos por día (pero tomamos hasta 10 días recientes)
  const groupDataByDevice = (metricKey) => {
    if (!metricKey) return [];

    const grouped = {};
    data.forEach((d) => {
      const device = d.deviceName || d.name;
      if (!grouped[device]) grouped[device] = [];
      grouped[device].push({
        date: d.date || d.timestamp?.toLocaleDateString() || "",
        label: d.label || d.date || "",
        ts: d.ts || d.timestamp?.getTime() || Date.now(),
        timestamp: d.timestamp,
        value: d[metricKey] || 0,
        deviceName: device,
      });
    });

    // Agregar por día promedio (siempre para líneas/áreas) y recortar a últimos 10 días
    const aggregateByDay = (arr) => {
      const bucket = {};
      arr.forEach((p) => {
        const dayKey = p.date;
        if (!bucket[dayKey]) bucket[dayKey] = { sum: 0, count: 0, ts: p.ts, label: p.date };
        bucket[dayKey].sum += p.value;
        bucket[dayKey].count += 1;
        bucket[dayKey].ts = Math.min(bucket[dayKey].ts, p.ts);
      });
      const aggregated = Object.entries(bucket)
        .map(([day, info]) => ({
          date: day,
          label: day,
          ts: info.ts,
          timestamp: new Date(info.ts),
          value: info.count > 0 ? info.sum / info.count : 0,
        }))
        .sort((a, b) => a.ts - b.ts);

      // Tomar los últimos 10 días para que siempre haya suficientes puntos y predicción
      return aggregated.slice(-10);
    };

    return Object.keys(grouped).map((device) => {
      const series = grouped[device].sort((a, b) => a.ts - b.ts);
      const dataSeries = aggregateByDay(series);
      return { deviceName: device, data: dataSeries };
    });
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

  const computeBaseline = useMemo(() => {
    if (!selectedMetric || data.length === 0) return null;
    const values = data
      .map((d) => d[selectedMetric])
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg;
  }, [data, selectedMetric]);

  const predictionLabel = useMemo(() => {
    const option = predictionOptions.find((o) => o.value === predictionHorizon);
    return option ? option.label : "";
  }, [predictionHorizon]);

// Pequeño "modelo ML" liviano: regresión lineal + variabilidad según varianza reciente.
const addPredictionsToSeries = (series) => {
    if (!predictionHorizon || predictionHorizon <= 0) return series;

  const predictValue = (points) => {
    if (!points || points.length === 0) return 0;
    const recent = points.slice(-10);
    if (recent.length < 2) return recent[recent.length - 1].value || 0;
    const baseDate = recent[0].timestamp.getTime();
    const xs = recent.map((p) => (p.timestamp.getTime() - baseDate) / (1000 * 60 * 60 * 24)); // días
    const ys = recent.map((p) => p.value || 0);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    const varY = ys.reduce((acc, v) => acc + Math.pow(v - sumY / n, 2), 0) / n;
    const std = Math.sqrt(varY);
    const targetX = xs[xs.length - 1] + predictionHorizon;
    // Añadimos un pequeño término proporcional a la desviación estándar para evitar predicciones planas
    return intercept + slope * targetX + 0.15 * std;
  };

    return series.map((s) => {
      const ordered = [...s.data].sort((a, b) => a.timestamp - b.timestamp);
      if (ordered.length === 0) return s;
    const predictedValue = predictValue(ordered);
    const last = ordered[ordered.length - 1];

      const futurePoints = [];
      for (let i = 1; i <= predictionHorizon; i++) {
        const futureDate = new Date(last.timestamp);
        futureDate.setDate(futureDate.getDate() + i);
        futurePoints.push({
          date: futureDate.toLocaleDateString("es-ES"),
          timestamp: futureDate,
        value: predictedValue,
          deviceName: s.deviceName,
          predicted: true,
        });
      }

      return {
        ...s,
        data: [...ordered, ...futurePoints],
      };
    });
  };

  const addPredictionToAggregated = (chartData) => {
    if (!predictionHorizon || predictionHorizon <= 0 || chartData.length === 0) return chartData;
    const metric = selectedMetric;
    const values = chartData.map((entry) => entry[metric] || 0);
    const first = values[0] || 0;
    const last = values[values.length - 1] || 0;
    const slope = values.length > 1 ? (last - first) / (values.length - 1) : 0;
    const predicted = last + slope * predictionHorizon;
    return [
      ...chartData,
      {
        name: `Predicción (+${predictionLabel})`,
        [metric]: predicted,
        predicted: true,
      },
    ];
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
    const baselineValue = computeBaseline;

    if (!metrics.includes(metric)) {
      setSelectedMetric(metrics[0] || "");
      return null;
    }

    switch (chartType) {
      case "line":
        // Agregamos todas las series en una sola línea (promedio diario) con un solo color
        const lineSeries = addPredictionsToSeries(groupDataByDevice(metric));
        if (lineSeries.length > 0) {
          const bucket = {};
          lineSeries.forEach((series) => {
            series.data.forEach((p) => {
              const tsKey = p.ts || p.timestamp?.getTime();
              const labelKey = p.label || p.date || "";
              if (!tsKey) return;
              if (!bucket[tsKey]) {
                bucket[tsKey] = { sum: 0, count: 0, ts: tsKey, label: labelKey };
              }
              bucket[tsKey].sum += p.value;
              bucket[tsKey].count += 1;
            });
          });

          const aggregatedLine = Object.values(bucket)
            .map((b) => ({
              ts: b.ts,
              label: b.label,
              value: b.count ? b.sum / b.count : 0,
            }))
            .sort((a, b) => a.ts - b.ts);

          // Serie de predicción separada para no alterar la curva original
          let predictionLine = [];
          if (predictionHorizon && predictionHorizon > 0 && aggregatedLine.length > 1) {
            const recent = aggregatedLine.slice(-10);
            const baseDate = recent[0].ts;
            const xs = recent.map((p) => (p.ts - baseDate) / (1000 * 60 * 60 * 24));
            const ys = recent.map((p) => p.value || 0);
            const n = xs.length;
            const sumX = xs.reduce((a, b) => a + b, 0);
            const sumY = ys.reduce((a, b) => a + b, 0);
            const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
            const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
            const denom = n * sumXX - sumX * sumX;
            const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
            const intercept = (sumY - slope * sumX) / n;
            const targetX = xs[xs.length - 1] + predictionHorizon;
            const varY = ys.reduce((acc, v) => acc + Math.pow(v - sumY / n, 2), 0) / n;
            const std = Math.sqrt(varY);
            const predictedValue = intercept + slope * targetX + 0.15 * std;
            const lastTs = aggregatedLine[aggregatedLine.length - 1].ts;
            const futureTs = lastTs + predictionHorizon * 24 * 60 * 60 * 1000;
            predictionLine = [
              aggregatedLine[aggregatedLine.length - 1],
              {
                ts: futureTs,
                label: new Date(futureTs).toLocaleDateString("es-ES"),
                value: predictedValue,
              },
            ];
          }

          return (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={aggregatedLine} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="label" 
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
                {baselineValue !== null && (
                  <ReferenceLine
                    y={baselineValue}
                    stroke="#ff4d4f"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    label={{ value: "Límite / normal", position: "insideTopRight", fill: "#ff4d4f", fontWeight: 700 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0077ff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Promedio diario"
                  connectNulls
                />
                {predictionLine.length === 2 && (
                  <Line
                    type="monotone"
                    data={predictionLine}
                    dataKey="value"
                    stroke="#ffa500"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    strokeOpacity={0.65}
                    dot={{ r: 5, stroke: "#ffa500", fill: "white", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="Predicción"
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          );
        }
        break;

      case "bar":
        const barData = addPredictionToAggregated(prepareBarChartData());
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
              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="#ff4d4f"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  label={{ value: "Límite / normal", position: "insideTopRight", fill: "#ff4d4f", fontWeight: 700 }}
                />
              )}
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
        const pieData = addPredictionToAggregated(prepareBarChartData())
          .slice(0, 10)
          .map((d) => ({
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
        const areaSeries = addPredictionsToSeries(groupDataByDevice(metric));
        if (areaSeries.length > 0) {
          const tsLabelMap = {};
          const allTs = new Set();
          areaSeries.forEach((series) => {
            series.data.forEach((point) => {
              const tsKey = point.ts || point.timestamp?.getTime();
              if (tsKey) {
                allTs.add(tsKey);
                tsLabelMap[tsKey] = point.label || point.date || "";
              }
            });
          });
          const sortedTs = Array.from(allTs).sort((a, b) => a - b);

          const areaChartData = sortedTs.map((ts) => {
            const point = { ts, label: tsLabelMap[ts] || "" };
            areaSeries.forEach((series) => {
              const dataPoint = series.data.find(
                (d) => (d.ts || d.timestamp?.getTime()) === ts
              );
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
                {baselineValue !== null && (
                  <ReferenceLine
                    y={baselineValue}
                    stroke="#ff4d4f"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    label={{ value: "Límite / normal", position: "insideTopRight", fill: "#ff4d4f", fontWeight: 700 }}
                  />
                )}
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
                    connectNulls
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
        const composedData = addPredictionToAggregated(prepareBarChartData());
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
              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="#ff4d4f"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  label={{ value: "Límite / normal", position: "insideTopRight", fill: "#ff4d4f", fontWeight: 700 }}
                />
              )}
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

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Predicción</InputLabel>
              <Select
                value={predictionHorizon}
                label="Predicción"
                onChange={(e) => setPredictionHorizon(parseInt(e.target.value, 10))}
              >
                {predictionOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {renderChart()}
        </CardContent>
      </Card>
    </Box>
  );
}
