import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Typography,
  Chip,
  Paper,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Search as SearchIcon } from "@mui/icons-material";

const API_BASE = "http://localhost:5000";

export default function TablaSensores({ databaseType, collection }) {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rowCount, setRowCount] = useState(0);

  // Obtener datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = "";
        if (databaseType === "mongodb") {
          url = `${API_BASE}/api/mongodb/${collection}?page=${page + 1}&limit=${pageSize}`;
          if (search) {
            url += `&device_name=${encodeURIComponent(search)}`;
          }
        } else {
          // PostgreSQL - usar el collection que viene como tabla
          url = `${API_BASE}/api/postgresql/${collection}?page=${page + 1}&limit=${pageSize}`;
          if (search) {
            url += `&search=${encodeURIComponent(search)}`;
          }
        }

        const res = await fetch(url);
        const json = await res.json();

        // Transformar datos para DataGrid
        const rows = (json.data || []).map((r, i) => {
          const row = { id: r._id || r.id || i };
          
          // Flatten nested objects
          Object.keys(r).forEach((key) => {
            if (typeof r[key] === "object" && r[key] !== null) {
              if (r[key].$date) {
                row[key] = new Date(r[key].$date).toLocaleString("es-ES");
              } else if (Array.isArray(r[key])) {
                row[key] = JSON.stringify(r[key]);
              } else {
                Object.keys(r[key]).forEach((nestedKey) => {
                  row[`${key}_${nestedKey}`] = r[key][nestedKey];
                });
              }
            } else {
              row[key] = r[key];
            }
          });
          return row;
        });

        setRowData(rows);
        setRowCount(json.total || rows.length);
      } catch (err) {
        console.error("Error fetching data:", err);
        setRowData([]);
        setRowCount(0);
      }
      setLoading(false);
    };

    fetchData();
  }, [databaseType, collection, page, pageSize, search]);

  const columns = useMemo(() => {
    if (rowData.length === 0) {
      // Columnas por defecto cuando no hay datos
      return [
        { field: "id", headerName: "ID", flex: 1, minWidth: 120 },
        { field: "device_name", headerName: "DEVICE NAME", flex: 1, minWidth: 150 },
        { field: "address", headerName: "ADDRESS", flex: 1, minWidth: 200 },
        { field: "timestamp", headerName: "TIMESTAMP", flex: 1, minWidth: 180 },
      ];
    }

    const sampleRow = rowData[0];
    const allKeys = Object.keys(sampleRow).filter((key) => key !== "id");
    
    // Priorizar columnas importantes
    const priorityKeys = [
      "device_name",
      "tipo_sensor",
      "address",
      "timestamp",
      "mediciones_distance",
      "mediciones_laeq",
      "mediciones_co2",
      "mediciones_temperature",
      "mediciones_battery",
      "location_latitude",
      "location_longitude",
    ];

    const orderedKeys = [
      ...priorityKeys.filter((k) => allKeys.includes(k)),
      ...allKeys.filter((k) => !priorityKeys.includes(k)),
    ].slice(0, 15); // Limitar a 15 columnas

    return orderedKeys.map((key) => {
      const headerName = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        field: key,
        headerName,
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const value = params.value;
          
          // Formatear valores especiales
          if (key.includes("timestamp") || key.includes("date")) {
            return (
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                {value || "-"}
              </Typography>
            );
          }
          
          if (key === "tipo_sensor") {
            return (
              <Chip
                label={value || "-"}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            );
          }
          
          if (key.includes("battery")) {
            const batteryValue = parseFloat(value);
            const color = batteryValue > 50 ? "success" : batteryValue > 20 ? "warning" : "error";
            return (
              <Chip
                label={`${batteryValue || 0}%`}
                size="small"
                color={color}
                sx={{ fontWeight: 600 }}
              />
            );
          }
          
          if (typeof value === "number") {
            return (
              <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {value.toLocaleString("es-ES")}
              </Typography>
            );
          }

          return (
            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
              {value !== null && value !== undefined ? String(value) : "-"}
            </Typography>
          );
        },
      };
    });
  }, [rowData]);

  return (
    <Card 
      sx={{ 
        borderRadius: 3, 
        boxShadow: 6,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        overflow: "hidden"
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2,
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          <SearchIcon sx={{ color: "text.secondary" }} />
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por dispositivo, dirección o ID..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "white",
              },
            }}
          />
          {rowCount > 0 && (
            <Chip
              label={`${rowCount} registros`}
              color="primary"
              sx={{ fontWeight: 600, minWidth: 100 }}
            />
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress size={60} />
          </Box>
        ) : rowData.length === 0 && !loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 6 }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              ⚠️ No se pudo conectar al servidor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Asegúrate de que el backend esté corriendo en http://localhost:5000
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Error: No se pueden cargar los datos
            </Typography>
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              height: 640,
              width: "100%",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
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
                border: "none",
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid rgba(224, 224, 224, 0.5)",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                  borderBottom: "2px solid rgba(102, 126, 234, 0.3)",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                  cursor: "pointer",
                },
                "& .MuiDataGrid-row:nth-of-type(even)": {
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "2px solid rgba(102, 126, 234, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
                "& .MuiDataGrid-toolbarContainer": {
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            />
          </Paper>
        )}
      </CardContent>
    </Card>
  );
}
