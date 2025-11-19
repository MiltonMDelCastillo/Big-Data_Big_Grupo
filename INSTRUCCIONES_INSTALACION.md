# Instrucciones de Instalación y Uso

## Backend (Data_Backend)

### 1. Instalar dependencias
```bash
cd Data_Backend
npm install
```

O si usas yarn:
```bash
cd Data_Backend
yarn install
```

### 2. Ejecutar el servidor
```bash
node server.js
```

El servidor se ejecutará en `http://localhost:5000`

### Endpoints disponibles:

#### MongoDB:
- `GET /api/mongodb/sensores-soterreados` - Sensores soterreados
- `GET /api/mongodb/sensores-sonidos` - Sensores de sonido
- `GET /api/mongodb/sensores-calidad-aire` - Sensores de calidad de aire
- `GET /api/mongodb/stats/:collection` - Estadísticas para gráficos

#### PostgreSQL:
- `GET /api/postgresql/tables` - Lista de tablas disponibles
- `GET /api/postgresql/:tableName` - Datos de una tabla específica

## Frontend (Data_Frontend)

### 1. Instalar dependencias
```bash
cd Data_Frontend
npm install
```

O si usas yarn:
```bash
cd Data_Frontend
yarn install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```

O:
```bash
yarn dev
```

La aplicación se abrirá en `http://localhost:5173` (o el puerto que Vite asigne)

## Características Implementadas

### ✅ Selector de Base de Datos
- Cambio entre MongoDB y PostgreSQL desde el frontend

### ✅ Pestañas
- **Tabla de Datos**: Visualización de datos en formato tabla con paginación
- **Gráficos**: Visualización de datos con diferentes tipos de gráficos

### ✅ Tipos de Gráficos Disponibles
- **Línea**: Gráfico de líneas para tendencias temporales
- **Barras**: Gráfico de barras para comparaciones
- **Pastel**: Gráfico circular para proporciones
- **Área**: Gráfico de área para acumulación
- **Dispersión**: Gráfico de dispersión para correlaciones

### ✅ Colecciones MongoDB
1. **Sensores Soterreados**: Mide nivel de agua en tanques
2. **Sensores Sonidos**: Mide decibeles en el ambiente
3. **Sensores Calidad Aire**: Mide CO2, temperatura, humedad y presión

### ✅ Funcionalidades
- Búsqueda y filtrado de datos
- Paginación del lado del servidor
- Exportación de datos (preparado)
- Visualización interactiva de gráficos
- Selector de métricas para gráficos

## Notas Importantes

1. **Conexiones**: Las cadenas de conexión están hardcodeadas en `server.js`. Para producción, se recomienda usar variables de entorno.

2. **PostgreSQL**: El endpoint de PostgreSQL detecta automáticamente las tablas disponibles. Asegúrate de que la base de datos tenga tablas accesibles.

3. **MongoDB**: Las colecciones deben existir en la base de datos MongoDB especificada.

4. **Puertos**: 
   - Backend: 5000
   - Frontend: 5173 (Vite por defecto)

## Solución de Problemas

### Error de conexión a MongoDB
- Verifica que la cadena de conexión sea correcta
- Asegúrate de que tu IP esté permitida en MongoDB Atlas

### Error de conexión a PostgreSQL
- Verifica las credenciales
- Asegúrate de que el servidor permita conexiones externas

### El frontend no carga datos
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores
- Verifica que la URL del API sea correcta (`http://localhost:5000`)

