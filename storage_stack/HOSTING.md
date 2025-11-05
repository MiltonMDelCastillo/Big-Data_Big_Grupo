# 🚀 Guía de Hosting para las Bases de Datos

## Opciones de Hosting

### 📊 **Opción 1: Servicios Gestionados (Recomendado para producción)**

#### PostgreSQL - Servicios Cloud:
- **Supabase** (Gratis hasta cierto límite): https://supabase.com
  - PostgreSQL gratuito con 500MB
  - Fácil de usar, incluye API REST
  
- **Neon** (Gratis): https://neon.tech
  - PostgreSQL serverless gratuito
  - Muy fácil de configurar
  
- **Railway** (Gratis con créditos): https://railway.app
  - Soporta PostgreSQL y MongoDB
  - Deploy fácil desde GitHub
  
- **Render** (Gratis con limitaciones): https://render.com
  - PostgreSQL gratuito (90 días)
  
- **AWS RDS** (Pago): https://aws.amazon.com/rds/
- **Google Cloud SQL** (Pago): https://cloud.google.com/sql
- **Azure Database** (Pago): https://azure.microsoft.com/services/postgresql/

#### MongoDB - Servicios Cloud:
- **MongoDB Atlas** (Gratis hasta 512MB): https://www.mongodb.com/cloud/atlas
  - **RECOMENDADO**: Gratis, fácil de usar
  - Cluster gratuito M0 con 512MB
  
- **Railway** (Gratis con créditos): https://railway.app
- **Render** (Pago)

---

### 🖥️ **Opción 2: VPS/Servidor Propio (Más control, requiere mantenimiento)**

#### Servicios de VPS:
- **DigitalOcean** (Desde $4/mes): https://www.digitalocean.com
- **Linode/Akamai** (Desde $5/mes): https://www.linode.com
- **Vultr** (Desde $2.50/mes): https://www.vultr.com
- **Hetzner** (Desde €4/mes): https://www.hetzner.com
- **AWS EC2** (Pago según uso)
- **Google Cloud Compute Engine** (Pago según uso)

#### Pasos para deployar en VPS:
1. Contratar un VPS (Ubuntu 22.04 recomendado)
2. Instalar Docker y Docker Compose
3. Subir tu proyecto
4. Configurar variables de entorno
5. Levantar con `docker compose up -d`

---

### 🔄 **Opción 3: Docker Compose en Servidor (Más simple)**

Si ya tienes un servidor, puedes usar el mismo `docker-compose.yml`:

```bash
# En tu servidor
git clone <tu-repo>
cd storage_stack
# Crear .env con credenciales de producción
docker compose up -d
```

---

## 📝 Pasos para Migrar a Servicios Gestionados

### A) Migrar a PostgreSQL (Supabase/Neon)

1. **Crear cuenta en Supabase o Neon**
2. **Obtener connection string**
3. **Exportar datos actuales:**
```bash
# Exportar desde tu PostgreSQL local
docker exec storage_stack-postgres-1 pg_dump -U postgres iot > backup.sql
```
4. **Importar en el nuevo servicio:**
```bash
# En Supabase/Neon te darán un comando similar a:
psql -h <host> -U <user> -d <database> < backup.sql
```

### B) Migrar a MongoDB Atlas

1. **Crear cuenta en MongoDB Atlas**
2. **Crear cluster gratuito (M0)**
3. **Obtener connection string**
4. **Exportar datos actuales:**
```bash
# Exportar desde tu MongoDB local
docker exec storage_stack-mongo-1 mongodump --uri="mongodb://localhost:27017" --db=iot --out=./backup
```
5. **Importar en Atlas:**
```bash
mongorestore --uri="<tu-connection-string>" --db=iot ./backup/iot
```

---

## 🔧 Actualizar el Código para Usar Servicios Remotos

### Actualizar `.env`:

```env
# PostgreSQL (Supabase/Neon)
PGHOST=tu-host.supabase.co
PGPORT=5432
PGUSER=postgres
PGPASSWORD=tu-password
PGDATABASE=postgres

# MongoDB Atlas
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=iot
```

---

## 💰 Comparación de Costos

| Servicio | PostgreSQL | MongoDB | Gratis |
|----------|-----------|---------|--------|
| **Supabase** | ✅ | ❌ | ✅ 500MB |
| **Neon** | ✅ | ❌ | ✅ 512MB |
| **MongoDB Atlas** | ❌ | ✅ | ✅ 512MB |
| **Railway** | ✅ | ✅ | ✅ $5 créditos/mes |
| **Render** | ✅ | ✅ | ⚠️ 90 días gratis |
| **DigitalOcean** | ✅ | ✅ | ❌ $4/mes |

---

## 🎯 Recomendación

Para empezar rápido y gratis:
1. **PostgreSQL**: Usar **Supabase** o **Neon** (ambos gratuitos)
2. **MongoDB**: Usar **MongoDB Atlas** (gratis hasta 512MB)

Para producción con más recursos:
- **Railway** o **Render** si quieres ambos en un lugar
- **VPS propio** (DigitalOcean, Hetzner) si quieres más control

---

## 📚 Scripts de Migración

¿Quieres que cree scripts para exportar/importar tus datos actuales? Puedo ayudarte a crear:
- Script de backup de PostgreSQL
- Script de backup de MongoDB
- Script de migración automática

