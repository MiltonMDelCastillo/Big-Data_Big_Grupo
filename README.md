# Proyecto Big Data - Sensores IoT

Proyecto para procesar y almacenar datos de sensores IoT usando Kafka y MongoDB. Optimizado para manejar más de 1 millón de registros.

## 📋 Requisitos Previos

- Python 3.8 o superior
- Docker y Docker Compose
- Conexión a Internet (para MongoDB Atlas)

## 🚀 Pasos para Abrir el Proyecto

### 1. Instalar Dependencias

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
pip install -r requirements.txt
```

O instala las dependencias individualmente:

```bash
pip install kafka-python==2.0.2
pip install pandas==2.0.3
pip install flask==2.3.3
pip install flask-cors==4.0.0
pip install pymongo==4.6.0
pip install numpy==1.24.3
pip install dnspython==2.4.2
```

### 2. Iniciar Kafka y MongoDB (Docker)

Navega a la carpeta `Infra` y ejecuta Docker Compose:

```bash
cd Infra
docker-compose up -d
```

Esto iniciará:
- **Zookeeper** (puerto 2181)
- **Kafka** (puerto 9092)
- **Kafka UI** (puerto 8080) - Interfaz web para ver los datos
- **MongoDB Local** (puerto 27017) - Opcional, se usa MongoDB Atlas

Verifica que los contenedores estén corriendo:

```bash
docker-compose ps
```

### 3. Verificar Conexión a MongoDB Atlas

El proyecto está configurado para usar MongoDB Atlas. La conexión ya está configurada en el código:

```
mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/
```

Base de datos: `sensores_iot`

### 4. Procesar los Archivos CSV

Navega a la carpeta `csv-producers` y ejecuta el script de procesamiento:

```bash
cd csv-producers
python producer_sensores.py
```

> 💡 **Sin Kafka?** Si solo quieres poblar MongoDB (por ejemplo en pruebas sin Docker),
> ejecuta el script con la variable `ENABLE_KAFKA=false`:
>
> ```bash
> set ENABLE_KAFKA=false   # En PowerShell: $env:ENABLE_KAFKA="false"
> python producer_sensores.py
> ```

> 🎯 **Cargar solo ciertos sensores?** Usa `SENSORES_ACTIVOS` con la lista deseada.
> Por ejemplo, para cargar únicamente aire y sonido:
> ```bash
> set SENSORES_ACTIVOS=sonido,calidad-aire
> python producer_sensores.py
> ```

> 📏 **Cambiar el límite por CSV?** Define `MAX_REGISTROS_POR_ARCHIVO`.  
> Ejemplo para procesar todo el archivo (sin límite):
> ```bash
> set MAX_REGISTROS_POR_ARCHIVO=0
> python producer_sensores.py
> ```

Este script:
- Lee los archivos CSV de la carpeta `data/`
- Limpia y procesa los datos
- Envía los datos a Kafka (topics: `topic-soterrados`, `topic-sonido`, `topic-calidad-aire`)
- Guarda los datos en MongoDB Atlas usando **bulk insert** (optimizado para grandes volúmenes)

**Archivos procesados:** (solo se cargan los que existan en `data/`)
- `data/subterraneo/EM310-UDL-915M soterrados nov 2024.csv` → Sensores soterrados
- `data/sonido/WS302-915M SONIDO NOV 2024.csv` → Sensores de sonido
- `data/aire/EM500-CO2-915M nov 2024.csv` → Sensores de calidad de aire

> ⏱️ **Límite por archivo:** por defecto se procesan máx. 200 000 registros de cada CSV para evitar saturar los servicios. Cambia el valor con `MAX_REGISTROS_POR_ARCHIVO`.

### 5. (Opcional) Ejecutar la API

En otra terminal, ejecuta la API para consultar los datos:

```bash
cd csv-producers
python api_sensores.py
```

La API estará disponible en: `http://localhost:5000`

**Endpoints disponibles:**
- `GET /` - Información de la API
- `GET /api/sensores/tipos` - Listar tipos de sensores
- `GET /api/sensores/<tipo>` - Datos de un sensor específico
- `GET /api/sensores/todos` - Todos los datos
- `GET /api/sensores/estadisticas` - Estadísticas generales

## ⚡ Optimizaciones Implementadas

El script ha sido optimizado para manejar más de 1 millón de registros:

1. **Bulk Insert en MongoDB**: Usa `insert_many()` en lugar de `insert_one()`, insertando 1000 documentos por lote
2. **Chunks más grandes**: Lee 5000 registros del CSV a la vez (antes 1000)
3. **Compresión en Kafka**: Mensajes comprimidos con gzip (se puede desactivar con `ENABLE_KAFKA=false`)
4. **Pool de conexiones**: MongoDB con pool de 10-50 conexiones
5. **Índices automáticos**: Se crean índices en MongoDB para mejorar consultas
6. **Manejo de errores**: Continúa procesando aunque haya errores en algunos registros

## 📊 Monitoreo

- **Kafka UI**: http://localhost:8080 - Ver topics y mensajes en tiempo real
- **MongoDB Atlas**: Accede a tu cluster en MongoDB Atlas para ver los datos almacenados

## 🗂️ Estructura del Proyecto

```
Big-Data_Big_Grupo/
├── csv-producers/
│   ├── producer_sensores.py    # Script principal de procesamiento
│   ├── limpieza_datos.py        # Módulo de limpieza de datos
│   └── api_sensores.py          # API REST para consultar datos
├── data/
│   ├── subterraneo/             # Sensores soterrados
│   ├── sonido/                  # Sensores de sonido
│   └── aire/                    # Sensores de calidad de aire
├── Infra/
│   └── docker-compose.yml      # Configuración Docker (Kafka, MongoDB)
├── requirements.txt            # Dependencias Python
└── README.md                   # Este archivo
```

## 🔧 Configuración de Rendimiento

Puedes ajustar los parámetros de rendimiento en `producer_sensores.py`:

```python
CHUNK_SIZE_CSV = 5000        # Tamaño de chunk para leer CSV
BATCH_SIZE_MONGODB = 1000    # Tamaño de lote para MongoDB
BATCH_SIZE_KAFKA = 5000      # Tamaño de lote para Kafka
MAX_REGISTROS_POR_ARCHIVO = 200000  # Límite por CSV (usa 0 para desactivar)
```

## ⚠️ Solución de Problemas

### Error: "Kafka no disponible"
- Verifica que Docker esté corriendo: `docker ps`
- Inicia los servicios: `cd Infra && docker-compose up -d`

### Error: "MongoDB Atlas no disponible"
- Verifica tu conexión a Internet
- Verifica las credenciales en el código
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas

### El proceso es muy lento
- Aumenta `BATCH_SIZE_MONGODB` (ej: 2000 o 5000)
- Aumenta `CHUNK_SIZE_CSV` (ej: 10000)
- Verifica tu conexión a Internet (MongoDB Atlas)

## 📝 Notas

- Los datos se almacenan en MongoDB Atlas (cloud), no en el MongoDB local de Docker
- El MongoDB local en Docker es opcional y no se usa por defecto
- Los datos se envían tanto a Kafka como a MongoDB
- El script procesa los archivos secuencialmente

## 👥 Autores

Proyecto Big Data - Grupo Big

