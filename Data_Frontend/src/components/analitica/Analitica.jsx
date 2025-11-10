import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, TextField } from "@mui/material";
import Histograma from "./Histograma";
import SerieTiempo from "./SerieTiempo";
import MapaCalor from "./MapaCalor";
import GraficaControl from "./GraficaControl";
import DiagramaPrediccion from "./DiagramaPrediccion";
import HerramientasAnalitica from "./HerramientasAnalitica";

import "./Analitica.css";

export default function Analitica() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterDevice, setFilterDevice] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:5000/events/joined?page=1&device=${filterDevice}`)
            .then((r) => r.json())
            .then((json) => {
                let rows = (json.data || []).map((r) => ({
                    time: r.time,
                    device: r.device,
                    tag: r.tag,
                    temperature: r.object?.temperature,
                    humidity: r.object?.humidity,
                    pressure: r.object?.pressure,
                    battery: r.object?.battery,
                    station_name: r.station?.device_name ?? r.station?.tag_name,
                }));

                if (startDate && endDate) {
                    rows = rows.filter((r) => {
                        const eventDate = new Date(r.time).toISOString().split("T")[0];
                        return eventDate >= startDate && eventDate <= endDate;
                    });
                }

                setData(rows);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error al cargar datos:", err);
                setLoading(false);
            });
    }, [filterDevice, startDate, endDate]);

    const handleExport = (exportData) => {
        const exportRows = exportData.length ? exportData : data;
        if (!exportRows.length) return alert("No hay datos para exportar");

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [
                Object.keys(exportRows[0]).join(","),
                ...exportRows.map((row) =>
                    Object.values(row)
                        .map((v) => (v !== null ? v : ""))
                        .join(",")
                ),
            ].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "eventos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box className="ana-container">
            <Card className="ana-card" sx={{ mb: 3 }}>
                <CardContent className="ana-header">
                    <Typography variant="h4" className="ana-title">
                        Analítica de Eventos
                    </Typography>

                    <Box className="ana-filters">
                        <TextField
                            label="Fecha inicio"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="ana-filter-input"
                        />
                        <TextField
                            label="Fecha fin"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="ana-filter-input"
                        />
                        <TextField
                            label="Filtrar por device"
                            value={filterDevice}
                            onChange={(e) => setFilterDevice(e.target.value)}
                            className="ana-filter-input"
                        />
                    </Box>
                </CardContent>
            </Card>

            {loading ? (
                <Typography className="ana-loading-text">Cargando datos...</Typography>
            ) : !data.length ? (
                <Typography className="ana-loading-text">No hay datos para mostrar</Typography>
            ) : (
                <Box className="ana-charts">
                    <Histograma data={data} />
                    <SerieTiempo data={data} />
                    <MapaCalor data={data} />
                    <GraficaControl data={data} />
                    <DiagramaPrediccion data={data} />
                    <HerramientasAnalitica onExport={() => handleExport(data)} />
                </Box>
            )}
        </Box>
    );
}
