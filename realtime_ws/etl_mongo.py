import logging
import time
import pandas as pd
from pymongo import MongoClient
from limpieza_datos import limpiar_datos
import psycopg2
from urllib.parse import quote

# ==================================
# LOGGING
# ==================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================================
# CONEXIÓN MONGODB ATLAS (NO SRV)
# ==================================
# Reemplaza con tu URI normal (NO-SRV)
# Ejemplo:
# "mongodb://user:pass@ac-1.mongodb.net:27017,ac-2.mongodb.net:27017/?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"

MONGO_URI = "mongodb://TU_URI_NO_SRV"

try:
    mongo_client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000
    )
    db_origen = mongo_client["sensores_iot"]
    coleccion_origen = db_origen["sensores_crudos"]
    mongo_client.server_info()  # Test conexión
    logger.info("✅ Conexión a MongoDB Atlas exitosa")
except Exception as e:
    logger.error(f"❌ Error conectando a MongoDB Atlas: {e}")
    raise e

# ==================================
# CONEXIÓN POSTGRESQL (SUPABASE)
# ==================================
pg_password = "CQZ_Kp2?xDDNV#S"
pg_password_enc = quote(pg_password)

PG_CONN_STRING = f"postgresql://postgres:{pg_password_enc}@db.hotnyzywbgoiktfiwqwe.supabase.co:5432/postgres"

try:
    pg_conn = psycopg2.connect(PG_CONN_STRING)
    pg_cursor = pg_conn.cursor()
    logger.info("✅ Conexión a PostgreSQL exitosa")
except Exception as e:
    logger.error(f"❌ Error conectando a PostgreSQL: {e}")
    raise e

# ==================================
# FUNCION ETL
# ==================================
def etl_mongodb_to_postgres(tipo_sensor, limite=500):
    logger.info(f"🔍 Buscando datos de tipo '{tipo_sensor}'...")

    docs = list(coleccion_origen.find({"tipo_sensor": tipo_sensor}).limit(limite))
    total = len(docs)

    logger.info(f"📦 {total} documentos encontrados")

    procesados = 0

    for doc in docs:
        try:
            fila_pd = pd.Series(doc)
            limpio = limpiar_datos(fila_pd)

            limpio["procesado_en"] = time.time()

            columnas = ", ".join(limpio.index)
            valores = tuple(limpio.values)
            placeholders = ", ".join(["%s"] * len(limpio))

            sql = f"INSERT INTO sensores_limpios ({columnas}) VALUES ({placeholders})"

            pg_cursor.execute(sql, valores)
            procesados += 1

            if procesados % 100 == 0:
                pg_conn.commit()
                logger.info(f"✔ {procesados} documentos guardados...")

        except Exception as e:
            logger.error(f"❌ Error procesando documento: {e}")

    pg_conn.commit()
    logger.info(f"🏁 ETL finalizado. Total insertados: {procesados}")

# ==================================
# MAIN
# ==================================
if __name__ == "__main__":
    etl_mongodb_to_postgres("soterrados", limite=500)

    pg_cursor.close()
    pg_conn.close()
    mongo_client.close()
