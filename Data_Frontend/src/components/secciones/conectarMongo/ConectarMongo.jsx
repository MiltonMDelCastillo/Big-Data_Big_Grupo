// ConectarMongo.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import "./ConectarMongo.css"; // estilos futuristas

export default function ConectarMongo() {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState("");
  const [page, setPage] = useState(0); // DataGrid usa 0-based
  const [pageSize, setPageSize] = useState(20);
  const [rowCount, setRowCount] = useState(0);

  // Consumir API con paginación y filtro remoto
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/events/joined?page=${page + 1}&limit=${pageSize}&device=${quickFilter}`
        );
        const json = await res.json();
        console.log("Events fetched:", json.data); // depuración

        const rows = (json.data || []).map((r, i) => ({
          id: i + page * pageSize,
          time: r.time,
          device: r.device,
          tag: r.tag,
          temperature: r.object?.temperature ?? null,
          humidity: r.object?.humidity ?? null, // Humidity real
          pressure: r.object?.pressure ?? null,
          battery: r.object?.battery ?? null,
          rss: r.rx?.rss ?? "",
          snr: r.rx?.snr ?? "",
          station_name: r.station?.station_name ?? r.station?.tag_name ?? "",
          station_address: r.station?.tag_address ?? "—", // dirección de la calle
          latestMeasurements: r.latestMeasurements ?? [],
        }));
        setRowData(rows);
        setRowCount(json.total || rows.length);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [page, pageSize, quickFilter]);

  // Columnas para DataGrid
  const columns = useMemo(
    () => [
      { field: "time", headerName: "Time", flex: 1.8, minWidth: 180 },
      { field: "device", headerName: "Device", flex: 1.5, minWidth: 120 },
      { field: "tag", headerName: "Tag", flex: 1, minWidth: 100 },
      {
        field: "temperature",
        headerName: "Temp (°C)",
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const v = params.value;
          if (v == null) return "—";
          const color =
            v >= 35 ? "#f44336" : v >= 25 ? "#ff9800" : "#4caf50";
          return (
            <span
              style={{
                background: color,
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {v.toFixed(1)}°
            </span>
          );
        },
      },
      {
        field: "humidity",
        headerName: "Humidity (%)",
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const v = params.value;
          if (v == null) return "—";
          const color = v >= 70 ? "#1976d2" : v >= 50 ? "#4caf50" : "#ff9800";
          return (
            <span
              style={{
                background: color,
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {v.toFixed(1)}%
            </span>
          );
        },
      },
      { field: "pressure", headerName: "Pressure", flex: 1.2, minWidth: 100 },
      { field: "battery", headerName: "Battery", flex: 0.9, minWidth: 90 },
      { field: "rss", headerName: "RSS", flex: 0.9, minWidth: 90 },
      { field: "snr", headerName: "SNR", flex: 0.9, minWidth: 90 },
      {
        field: "station_address",
        headerName: "Calle / Dirección",
        flex: 1.4,
        minWidth: 180,
      },
      {
        field: "actions",
        headerName: "Acciones",
        flex: 0.9,
        minWidth: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const meas = params.row.latestMeasurements || [];
          return (
            <Button
              variant="contained"
              size="small"
              className="futuristic-btn"
              onClick={() =>
                alert(
                  `Últimas mediciones (${meas.length}):\n` +
                    meas.map((m) => `${m.variable_id}: ${m.value_num} @ ${m.ts}`).join("\n")
                )
              }
            >
              Ver
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 6 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, flex: "1 1 auto", color: "#000" }}
            >
              📡 Eventos · Dashboard
            </Typography>

            <TextField
              size="small"
              placeholder="🔎 Buscar (device, tag, estación...)"
              onChange={(e) => {
                setPage(0); // resetear página al filtrar
                setQuickFilter(e.target.value);
              }}
              sx={{ width: 360, background: "#fff", borderRadius: 1 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ width: "100%", height: 640 }}>
              <DataGrid
                rows={rowData}
                columns={columns}
                rowCount={rowCount}
                page={page}
                pageSize={pageSize}
                pagination
                paginationMode="server"
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => setPageSize(newSize)}
                rowsPerPageOptions={[20, 50, 100]}
                components={{ Toolbar: GridToolbar }}
                sx={{
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(75,108,183,0.1)",
                    transform: "scale(1.01)",
                    transition: "all 0.2s ease",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    background: "#fff",
                    color: "#000",
                    fontWeight: 700,
                  },
                  "& .MuiDataGrid-cell": {
                    outline: "none",
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
