import os
import json
import logging
from datetime import datetime

import pandas as pd
from kafka import KafkaProducer
from pymongo import MongoClient
from pymongo.errors import BulkWriteError, DuplicateKeyError

from limpieza_datos import limpiar_datos

# Configurar logging para ver qué está pasando
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# CONFIGURACIÓN DE RENDIMIENTO
CHUNK_SIZE_CSV = 5000  # Tamaño de chunk para leer CSV (aumentado para mejor rendimiento)
BATCH_SIZE_MONGODB = 1000  # Tamaño de lote para inserción en MongoDB (bulk insert)
BATCH_SIZE_KAFKA = 5000  # Tamaño de lote para flush de Kafka
MAX_REGISTROS_POR_ARCHIVO = int(os.getenv('MAX_REGISTROS_POR_ARCHIVO', '200000'))  # Límite por CSV para evitar cargas enormes

# Feature flag para permitir ejecutar el ETL sin Kafka (útil en pruebas o cuando Docker no está disponible)
ENABLE_KAFKA = os.getenv('ENABLE_KAFKA', 'true').lower() == 'true'


def crear_kafka_producer():
    """
    Crea un productor de Kafka si está habilitado. Si falla, retorna None para permitir continuar con la ingesta.
    """
    if not ENABLE_KAFKA:
        logger.warning("⚠️  Kafka deshabilitado por configuración (ENABLE_KAFKA=false). Continuando solo con MongoDB.")
        return None

    try:
        producer_obj = KafkaProducer(
            bootstrap_servers=['localhost:9092'],  # Puerto de Kafka en Docker
            value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),  # Convertir a JSON
            batch_size=32768,  # Aumentado para mejor rendimiento
            linger_ms=50,  # Esperar un poco más para agrupar mensajes
            compression_type='gzip',  # Comprimir mensajes para ahorrar ancho de banda
            max_in_flight_requests_per_connection=5  # Permitir más requests en paralelo
        )
        logger.info("✅ KafkaProducer creado correctamente - Conectado a localhost:9092")
        return producer_obj
    except Exception as e:
        logger.warning(f"⚠️  Kafka no disponible: {e}")
        logger.warning("⚠️  Continuando sin enviar datos a Kafka. Verifica docker-compose si necesitas los topics.")
        return None


producer = crear_kafka_producer()

# Configuración MongoDB - Conexión con MongoDB Atlas
try:
    mongo_uri = 'mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/'
    mongo_client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=10000,  # Aumentado timeout
        maxPoolSize=50,  # Aumentar pool de conexiones
        minPoolSize=10
    )
    # Verificar conexión
    mongo_client.server_info()
    db = mongo_client['sensores_iot']
    logger.info("✅ MongoDB Atlas conectado correctamente - Base de datos: sensores_iot")
except Exception as e:
    logger.error(f"❌ Error conectando a MongoDB Atlas: {e}")
    logger.info("💡 Verifica tu conexión a internet y las credenciales de MongoDB Atlas")
    mongo_client = None
    db = None

def procesar_csv_sensores(ruta_archivo, tipo_sensor):
    """
    Procesa archivos CSV de sensores IoT y envía los datos a Kafka y MongoDB
    OPTIMIZADO para manejar más de 1 millón de registros usando bulk insert
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        tipo_sensor (str): Tipo de sensor (soterrados, sonido, calidad-aire)
    """
    
    try:
        # Verificar que el archivo existe
        if not os.path.exists(ruta_archivo):
            logger.error(f"❌ Archivo no encontrado: {ruta_archivo}")
            return 0
        
        total_registros = 0
        total_procesados = 0
        total_errores = 0
        limite_registros = MAX_REGISTROS_POR_ARCHIVO if MAX_REGISTROS_POR_ARCHIVO > 0 else None
        
        # Buffer para acumular documentos de MongoDB antes de insertar en lote
        buffer_mongodb = []
        
        logger.info(f"📂 Procesando: {ruta_archivo} como {tipo_sensor}")
        logger.info(f"⚙️  Configuración: Chunk CSV={CHUNK_SIZE_CSV}, Batch MongoDB={BATCH_SIZE_MONGODB}")
        if limite_registros:
            logger.info(f"⚠️  Se procesarán máximo {limite_registros:,} registros de este archivo")
        
        # Obtener colección de MongoDB una sola vez
        coleccion = None
        if db is not None:
            coleccion = db[f'sensores_{tipo_sensor}']
            # Crear índices para mejorar rendimiento (si no existen)
            try:
                coleccion.create_index([('timestamp', 1), ('tipo_sensor', 1)])
                coleccion.create_index('device_name')
            except:
                pass  # Los índices ya existen o hay error, continuar
        
        topic = f"topic-{tipo_sensor}"
        timestamp_ingesta_base = datetime.now()
        
        # Leer CSV por chunks (pedazos) para archivos grandes
        for chunk_num, chunk in enumerate(pd.read_csv(ruta_archivo, chunksize=CHUNK_SIZE_CSV, low_memory=False)):
            if limite_registros and total_procesados >= limite_registros:
                logger.info(f"   ✅ Límite alcanzado antes de leer chunk {chunk_num + 1}")
                break
            logger.info(f"   📦 Procesando Chunk {chunk_num + 1} - {len(chunk)} registros")
            
            # Procesar cada fila del chunk
            for idx, fila in chunk.iterrows():
                if limite_registros and total_procesados >= limite_registros:
                    logger.info(f"   ✅ Límite alcanzado ({total_procesados:,}/{limite_registros:,})")
                    break
                try:
                    # LIMPIEZA DE DATOS usando el módulo de limpieza
                    datos_limpios = limpiar_datos(fila, tipo_sensor)
                    
                    # Crear ID único más robusto
                    id_unico = f"{tipo_sensor}_{chunk_num}_{idx}_{total_registros}"
                    
                    # Crear mensaje estructurado para Kafka
                    mensaje = {
                        'id_unico': id_unico,
                        'tipo_sensor': tipo_sensor,
                        'timestamp_original': datos_limpios.get('timestamp'),
                        'timestamp_ingesta': timestamp_ingesta_base.isoformat(),
                        'fuente_archivo': os.path.basename(ruta_archivo),
                        'datos_limpios': datos_limpios
                    }
                    
                    # Enviar a Kafka (asíncrono, no bloquea)
                    if producer is not None:
                        producer.send(topic, value=mensaje)
                    
                    # Preparar documento para MongoDB (acumular en buffer)
                    if coleccion is not None:
                        documento_mongo = {
                            '_id': id_unico,
                            'tipo_sensor': tipo_sensor,
                            'timestamp_ingesta': timestamp_ingesta_base,
                            'fuente_archivo': os.path.basename(ruta_archivo),
                            **datos_limpios
                        }
                        
                        # Convertir timestamp string a datetime si existe
                        if 'timestamp' in documento_mongo and isinstance(documento_mongo['timestamp'], str):
                            try:
                                documento_mongo['timestamp'] = datetime.fromisoformat(
                                    documento_mongo['timestamp'].replace('Z', '+00:00')
                                )
                            except:
                                pass  # Mantener como string si no se puede parsear
                        
                        buffer_mongodb.append(documento_mongo)
                    
                    total_registros += 1
                    total_procesados += 1
                    
                    # Insertar en MongoDB cuando el buffer alcanza el tamaño del lote
                    if len(buffer_mongodb) >= BATCH_SIZE_MONGODB:
                        try:
                            # Bulk insert en MongoDB (MUCHO más rápido que insert_one)
                            resultado = coleccion.insert_many(buffer_mongodb, ordered=False)
                            logger.info(f"   💾 Insertados {len(resultado.inserted_ids)} documentos en MongoDB (lote)")
                        except BulkWriteError as bwe:
                            # Algunos documentos pueden fallar (duplicados, etc.), pero continuamos
                            insertados = len(bwe.details.get('insertedIds', []))
                            logger.warning(f"   ⚠️  Insertados {insertados}/{len(buffer_mongodb)} documentos (algunos duplicados)")
                        except Exception as e_mongo:
                            logger.warning(f"   ⚠️  Error en bulk insert MongoDB: {e_mongo}")
                        
                        buffer_mongodb = []  # Limpiar buffer
                    
                    # Flush periódico de Kafka
                    if producer is not None and total_registros % BATCH_SIZE_KAFKA == 0:
                        producer.flush()
                        logger.info(f"   📤 Procesados {total_registros} registros... (Kafka flushed)")
                        
                except Exception as e:
                    total_errores += 1
                    if total_errores <= 10:  # Solo mostrar primeros 10 errores
                        logger.error(f"❌ Error en fila {idx}: {e}")
                    continue  # Continuar con siguiente fila si hay error
            
            # Flush después de cada chunk para no acumular demasiado
            if producer is not None:
                producer.flush()
        
        # Insertar documentos restantes en el buffer
        if buffer_mongodb and coleccion is not None:
            try:
                resultado = coleccion.insert_many(buffer_mongodb, ordered=False)
                logger.info(f"   💾 Insertados {len(resultado.inserted_ids)} documentos finales en MongoDB")
            except BulkWriteError as bwe:
                insertados = len(bwe.details.get('insertedIds', []))
                logger.warning(f"   ⚠️  Insertados {insertados}/{len(buffer_mongodb)} documentos finales")
            except Exception as e_mongo:
                logger.warning(f"   ⚠️  Error en bulk insert final: {e_mongo}")
        
        # Flush final para asegurar que todos los mensajes se envíen
        if producer is not None:
            producer.flush()
        
        logger.info(f"✅ {ruta_archivo}: {total_procesados} registros procesados")
        if producer is not None:
            logger.info(f"   📊 Enviados a Kafka: {total_procesados}")
        else:
            logger.info("   📊 Kafka omitido (ENABLE_KAFKA=false o Kafka no disponible)")
        logger.info(f"   💾 Guardados en MongoDB: {total_procesados - total_errores}")
        logger.info(f"   ❌ Errores: {total_errores}")
        
        return total_procesados
        
    except Exception as e:
        logger.error(f"❌ Error procesando {ruta_archivo}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return 0

if __name__ == "__main__":
    logger.info("🚀 INICIANDO INGESTA DE DATOS DE SENSORES IoT")
    logger.info("📊 Destinos: Kafka + MongoDB (con limpieza de datos)")
    logger.info("=" * 60)
    
    # Obtener la ruta base del proyecto (un nivel arriba de la carpeta actual 'csv-producers')
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    # CONFIGURACIÓN DE ARCHIVOS - USANDO JERARQUÍA DE CARPETAS
    archivos_config = [
        {
            'archivo': os.path.join(DATA_DIR, 'subterraneo', 'EM310-UDL-915M soterrados nov 2024.csv'),
            'tipo': 'soterrados',
            'descripcion': 'Sensores de nivel de líquido/tanques'
        },
        {
            'archivo': os.path.join(DATA_DIR, 'sonido', 'WS302-915M SONIDO NOV 2024.csv'),
            'tipo': 'sonido',
            'descripcion': 'Sensores de medición de decibeles'
        },
        {
            'archivo': os.path.join(DATA_DIR, 'aire', 'EM500-CO2-915M nov 2024.csv'),
            'tipo': 'calidad-aire',  # EM500-CO2 es calidad de aire
            'descripcion': 'Sensores de CO2, temperatura, humedad'
        }
    ]

    # Filtrar solo archivos existentes (permite trabajar aunque falten carpetas como 'subterraneo')
    archivos_disponibles = []
    for cfg in archivos_config:
        if os.path.exists(cfg['archivo']):
            archivos_disponibles.append(cfg)
        else:
            logger.warning(f"⚠️  Archivo no encontrado, se omite: {cfg['archivo']}")

    if not archivos_disponibles:
        logger.error("❌ No se encontró ningún archivo de sensores. Verifica la carpeta data/")
        exit(1)

    # Permitir activar solo ciertos sensores vía variable de entorno (ej: SENSORES_ACTIVOS="sonido,calidad-aire")
    sensores_activos_env = os.getenv('SENSORES_ACTIVOS')
    sensores_activos = None
    if sensores_activos_env:
        sensores_activos = {s.strip().lower() for s in sensores_activos_env.split(',') if s.strip()}
        logger.info(f"⚙️  SENSORES_ACTIVOS detectado: {sensores_activos}")
    
    total_general = 0
    
    # Procesar cada archivo de sensores
    for config in archivos_disponibles:
        archivo = config['archivo']
        tipo = config['tipo']
        descripcion = config['descripcion']

        if sensores_activos and tipo.lower() not in sensores_activos:
            logger.info(f"⏭️  Saltando {tipo} (no incluido en SENSORES_ACTIVOS)")
            continue
        
        logger.info(f"🎯 {descripcion}")
        total_archivo = procesar_csv_sensores(archivo, tipo)
        total_general += total_archivo
        logger.info("-" * 50)
    
    # Cerrar conexiones
    if producer is not None:
        producer.close()
    if mongo_client:
        mongo_client.close()
        logger.info("✅ Conexión a MongoDB cerrada")
    
    logger.info(f"🎯 INGESTA COMPLETADA - Total: {total_general} registros")
    logger.info("📊 Puedes ver los datos en:")
    logger.info("   - Kafka UI: http://localhost:8080")
    logger.info("   - MongoDB Atlas: cluster0.e0tjitb.mongodb.net (Base: sensores_iot)")
    logger.info("🌐 Ejecuta la API con: python api_sensores.py")