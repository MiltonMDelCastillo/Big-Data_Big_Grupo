# 🍃 Guía de Migración a MongoDB Atlas

## Paso 1: Crear cuenta y cluster en MongoDB Atlas

1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (elige el plan **M0 FREE** - 512MB)
4. Configura:
   - **Cloud Provider**: Elige el más cercano a tu ubicación
   - **Region**: La más cercana
   - **Cluster Name**: Puede ser `cluster0` o el que prefieras

## Paso 2: Configurar acceso a la base de datos

### A) Crear usuario de base de datos:
1. En MongoDB Atlas, ve a **Database Access** (lado izquierdo)
2. Click en **Add New Database User**
3. Elige **Password** como método de autenticación
4. Usuario: `iotuser` (o el que prefieras)
5. Contraseña: Genera una segura o usa una propia
6. **Guarda estas credenciales** (las necesitarás)
7. Permisos: **Read and write to any database**
8. Click **Add User**

### B) Configurar red (whitelist):
1. Ve a **Network Access** (lado izquierdo)
2. Click **Add IP Address**
3. Para desarrollo local: Click **Add Current IP Address**
4. Para permitir desde cualquier lugar (solo desarrollo): `0.0.0.0/0`
   ⚠️ **ADVERTENCIA**: Solo para desarrollo, no usar en producción
5. Click **Confirm**

## Paso 3: Obtener connection string

1. Ve a **Database** (lado izquierdo)
2. Click **Connect** en tu cluster
3. Elige **Connect your application**
4. **Driver**: Python
5. **Version**: 4.6 or later
6. Copia la connection string, se verá así:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Reemplaza `<username>` y `<password>` con tus credenciales
8. Agrega el nombre de la base de datos al final:
   ```
   mongodb+srv://iotuser:tu-password@cluster0.xxxxx.mongodb.net/iot?retryWrites=true&w=majority
   ```

## Paso 4: Hacer backup de tu MongoDB local

Ejecuta el script de backup:

```powershell
.\backup_mongo.ps1
```

Esto creará una carpeta `backup_mongo_YYYYMMDD_HHMMSS/` con todos tus datos.

## Paso 5: Importar datos a MongoDB Atlas

### Opción A: Usando MongoDB Compass (Recomendado - GUI)
1. Descarga MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Conecta usando tu connection string
3. Ve a la base de datos `iot`
4. Importa los datos desde la carpeta de backup

### Opción B: Usando mongorestore (Línea de comandos)
```powershell
# Instalar MongoDB Database Tools si no lo tienes
# Descarga: https://www.mongodb.com/try/download/database-tools

# Importar datos
mongorestore --uri="mongodb+srv://iotuser:tu-password@cluster0.xxxxx.mongodb.net/iot?retryWrites=true&w=majority" ./backup_mongo_YYYYMMDD_HHMMSS/iot
```

## Paso 6: Actualizar tu archivo .env

Actualiza el archivo `.env` con tu connection string de Atlas:

```env
# PostgreSQL (sigue siendo local o tu configuración)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=iot

# MongoDB Atlas
MONGO_URI=mongodb+srv://iotuser:tu-password@cluster0.xxxxx.mongodb.net/iot?retryWrites=true&w=majority
MONGO_DB=iot

# CSV Path
CSV_PATH=./data/EM500-CO2-915M nov 2024.csv
```

## Paso 7: Verificar la conexión

Ejecuta un script de prueba o consulta directamente:

```powershell
# Activa el entorno virtual
.venv\Scripts\Activate.ps1

# Prueba la conexión con Python
python -c "from pymongo import MongoClient; import os; from dotenv import load_dotenv; load_dotenv(); client = MongoClient(os.getenv('MONGO_URI')); print('✅ Conectado a:', client.server_info()['host']); print('Bases de datos:', client.list_database_names())"
```

## Paso 8: Detener MongoDB local (opcional)

Si ya migraste todo y no necesitas MongoDB local:

```powershell
# Detener solo el contenedor de MongoDB
docker stop storage_stack-mongo-1

# O comentar MongoDB en docker-compose.yml
```

## ✅ Verificación final

1. Verifica que puedes conectarte a Atlas
2. Verifica que los datos están ahí:
   ```powershell
   # Usando MongoDB Compass o mongosh
   # Deberías ver tu colección "events" con todos los documentos
   ```
3. Prueba ejecutar una consulta desde tu aplicación

## 🆘 Troubleshooting

### Error: "Authentication failed"
- Verifica que el usuario y contraseña estén correctos
- Asegúrate de haber reemplazado `<username>` y `<password>` en el connection string

### Error: "IP not whitelisted"
- Ve a Network Access en Atlas
- Agrega tu IP actual o usa `0.0.0.0/0` para desarrollo

### Error: "Connection timeout"
- Verifica que tu firewall permita conexiones salientes
- Verifica que el connection string esté correcto

### Los datos no aparecen
- Verifica que importaste a la base de datos correcta (`iot`)
- Verifica que la colección se llame `events`
- Usa MongoDB Compass para verificar visualmente

