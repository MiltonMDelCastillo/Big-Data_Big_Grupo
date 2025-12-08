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

/**
 * Componente que muestra datos de sensores en una tabla paginada y con búsqueda.
 * Se conecta a un backend para obtener datos de MongoDB o PostgreSQL.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.databaseType - El tipo de base de datos ('mongodb' o 'postgresql').
 * @param {string} props.collection - El nombre de la colección (MongoDB) o tabla (PostgreSQL) a consultar.
 */
export default function TablaSensores({ databaseType, collection }) {
  // --- ESTADOS DEL COMPONENTE ---

  // Almacena los datos transformados para mostrar en la tabla.
  const [rowData, setRowData] = useState([]);
  // Controla la visualización del indicador de carga.
  const [loading, setLoading] = useState(true);
  // Almacena el término de búsqueda introducido por el usuario.
  const [search, setSearch] = useState("");
  // Controla la página actual de la paginación (inicia en 0).
  const [page, setPage] = useState(0);
  // Controla el número de filas por página.
  const [pageSize, setPageSize] = useState(20);
  // Almacena el número total de registros disponibles en el backend para la paginación.
  const [rowCount, setRowCount] = useState(0);

  // --- EFECTO PARA OBTENER DATOS ---
  // Se ejecuta cada vez que cambian la base de datos, la colección, la página, el tamaño de página o la búsqueda.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = "";
        // Construye la URL de la API según la base de datos seleccionada.
        if (databaseType === "mongodb") {
          url = `${API_BASE}/api/mongodb/${collection}?page=${page + 1}&limit=${pageSize}`;
          if (search) {
            url += `&device_name=${encodeURIComponent(search)}`;
          }
        } else {
          // Para PostgreSQL, 'collection' se usa como nombre de tabla.
          url = `${API_BASE}/api/postgresql/${collection}?page=${page + 1}&limit=${pageSize}`;
          if (search) {
            url += `&search=${encodeURIComponent(search)}`;
          }
        }

        const res = await fetch(url);
        const json = await res.json();

        // Transforma los datos recibidos para que sean compatibles con el componente DataGrid.
        const rows = (json.data || []).map((r, i) => {
          // Asigna un ID único a cada fila, necesario para DataGrid.
          const row = { id: r._id || r.id || i };
          
          // "Aplana" los objetos anidados para mostrarlos como columnas separadas.
          Object.keys(r).forEach((key) => {
            if (typeof r[key] === "object" && r[key] !== null) {
              if (r[key].$date) { // Manejo especial para fechas de MongoDB.
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

        // Actualiza el estado con los datos y la cuenta total de filas.
        setRowData(rows);
        setRowCount(json.total || rows.length);
      } catch (err) {
        console.error("Error fetching data:", err);
        // En caso de error, limpia los datos para mostrar un mensaje al usuario.
        setRowData([]);
        setRowCount(0);
      }
      setLoading(false);
    };

    fetchData();
  }, [databaseType, collection, page, pageSize, search]);

  // --- MEMOIZACIÓN DE COLUMNAS ---
  // `useMemo` evita que las columnas se recalculen en cada renderizado, solo cuando los datos cambian.
  const columns = useMemo(() => {
    if (rowData.length === 0) {
      // Muestra columnas por defecto si no hay datos cargados.
      return [
        { field: "id", headerName: "ID", flex: 1, minWidth: 120 },
        { field: "device_name", headerName: "DEVICE NAME", flex: 1, minWidth: 150 },
        { field: "address", headerName: "ADDRESS", flex: 1, minWidth: 200 },
        { field: "timestamp", headerName: "TIMESTAMP", flex: 1, minWidth: 180 },
      ];
    }
    // Genera las columnas dinámicamente a partir de las claves del primer objeto de datos.
    const sampleRow = rowData[0];
    const allKeys = Object.keys(sampleRow).filter((key) => key !== "id");
    
    // Define un orden de prioridad para las columnas más relevantes.
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

    // Ordena las claves y limita el número total de columnas a 15 para mantener la tabla legible.
    const orderedKeys = [
      ...priorityKeys.filter((k) => allKeys.includes(k)),
      ...allKeys.filter((k) => !priorityKeys.includes(k)),
    ].slice(0, 15);

    // Crea la definición de cada columna para DataGrid.
    return orderedKeys.map((key) => {
      const headerName = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        field: key,
        headerName,
        flex: 1,
        minWidth: 120,
        // `renderCell` permite personalizar cómo se muestra el contenido de cada celda.
        renderCell: (params) => {
          const value = params.value;
          
          // Formateo especial para timestamps.
          if (key.includes("timestamp") || key.includes("date")) {
            return (
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                {value || "-"}
              </Typography>
            );
          }
          
          // Muestra el tipo de sensor como un Chip de Material-UI.
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
          
          // Muestra el nivel de batería como un Chip con color condicional.
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
          
          // Formatea los valores numéricos.
          if (typeof value === "number") {
            return (
              <Typography variant="body2" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {value.toLocaleString("es-ES")}
              </Typography>
            );
          }

          // Valor por defecto para otros tipos de datos.
          return (
            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
              {value !== null && value !== undefined ? String(value) : "-"}
            </Typography>
          );
        },
      };
    });
  }, [rowData]);

  // --- RENDERIZADO DEL COMPONENTE ---

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
        {/* Barra de búsqueda y contador de registros */}
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
              // Al buscar, resetea la paginación a la primera página.
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

        {/* Lógica de renderizado condicional */}
        {loading ? (
          // Muestra un spinner mientras se cargan los datos.
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress size={60} />
          </Box> // Muestra un mensaje de error si no hay datos y no está cargando.
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
          // Muestra la tabla de datos si todo está correcto.
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
              pagination // Habilita la paginación.
              paginationMode="server" // Indica que la paginación se maneja en el servidor.
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => setPageSize(newSize)}
              rowsPerPageOptions={[20, 50, 100]}
              // Habilita la barra de herramientas de DataGrid (exportar, filtrar, etc.).
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
