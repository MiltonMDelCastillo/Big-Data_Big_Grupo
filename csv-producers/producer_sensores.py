from kafka import KafkaProducer
import pandas as pd
import json
import os
from datetime import datetime
import logging
from pymongo import MongoClient
from limpieza_datos import limpiar_datos

# Configurar logging para ver qué está pasando
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración Kafka - Conexión con Docker
try:
    producer = KafkaProducer(
        bootstrap_servers=['localhost:9092'],  # Puerto de Kafka en Docker
        value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),  # Convertir a JSON
        batch_size=16384,  # Mejor rendimiento para muchos mensajes
        linger_ms=10
    )
    logger.info("✅ KafkaProducer creado correctamente - Conectado a localhost:9092")
except Exception as e:
    logger.error(f"❌ Error creando KafkaProducer: {e}")
    logger.info("💡 Asegúrate que Docker con Kafka esté ejecutándose: docker-compose up -d")
    exit(1)

# Configuración MongoDB - Conexión con MongoDB Atlas
try:
    mongo_uri = 'mongodb+srv://fabricabla_db_user:ifMIBidJuyoCai24@cluster0.e0tjitb.mongodb.net/'
    mongo_client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000
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
    Procesa archivos CSV de sensores IoT y envía los datos a Kafka
    
    Args:
        ruta_archivo (str): Ruta al archivo CSV
        tipo_sensor (str): Tipo de sensor (soterrados, sonido, calidad-aire)
    """
    
    try:
        # Verificar que el archivo existe
        if not os.path.exists(ruta_archivo):
            logger.error(f"❌ Archivo no encontrado: {ruta_archivo}")
            return 0
            
        chunk_size = 1000  # Procesar en lotes para no sobrecargar memoria
        total_registros = 0
        
        logger.info(f"📂 Procesando: {ruta_archivo} como {tipo_sensor}")
        
        # Leer CSV por chunks (pedazos) para archivos grandes
        for chunk_num, chunk in enumerate(pd.read_csv(ruta_archivo, chunksize=chunk_size)):
            logger.info(f"   📦 Chunk {chunk_num} - {len(chunk)} registros")
            
            # Procesar cada fila del chunk
            for idx, fila in chunk.iterrows():
                try:
                    # LIMPIEZA DE DATOS usando el módulo de limpieza
                    datos_limpios = limpiar_datos(fila, tipo_sensor)
                    
                    # Crear mensaje estructurado para Kafka y MongoDB
                    id_unico = f"{tipo_sensor}_{fila.get('_id', idx)}_{total_registros}"
                    
                    mensaje = {
                        'id_unico': id_unico,
                        'tipo_sensor': tipo_sensor,
                        'timestamp_original': datos_limpios.get('timestamp'),
                        'timestamp_ingesta': datetime.now().isoformat(),  # Cuando lo procesamos
                        'fuente_archivo': os.path.basename(ruta_archivo),
                        'datos_limpios': datos_limpios  # Datos ya limpios y estructurados
                    }
                    
                    # Enviar a topic específico de Kafka
                    topic = f"topic-{tipo_sensor}"
                    producer.send(topic, value=mensaje)
                    
                    # Guardar en MongoDB
                    if db is not None:
                        try:
                            # Preparar documento para MongoDB
                            documento_mongo = {
                                '_id': id_unico,
                                'tipo_sensor': tipo_sensor,
                                'timestamp_ingesta': datetime.now(),
                                'fuente_archivo': os.path.basename(ruta_archivo),
                                **datos_limpios  # Expandir los datos limpios
                            }
                            
                            # Convertir timestamp string a datetime si existe
                            if 'timestamp' in documento_mongo and isinstance(documento_mongo['timestamp'], str):
                                try:
                                    documento_mongo['timestamp'] = datetime.fromisoformat(
                                        documento_mongo['timestamp'].replace('Z', '+00:00')
                                    )
                                except:
                                    pass  # Mantener como string si no se puede parsear
                            
                            # Insertar en colección específica del tipo de sensor
                            coleccion = db[f'sensores_{tipo_sensor}']
                            coleccion.insert_one(documento_mongo)
                            
                        except Exception as e_mongo:
                            logger.warning(f"⚠️ Error guardando en MongoDB (fila {idx}): {e_mongo}")
                    
                    total_registros += 1
                    
                    # Flush periódico para no acumular en memoria
                    if total_registros % 500 == 0:
                        producer.flush()
                        logger.info(f"   📤 Enviados {total_registros} registros a Kafka y MongoDB...")
                        
                except Exception as e:
                    logger.error(f"❌ Error en fila {idx}: {e}")
                    continue  # Continuar con siguiente fila si hay error
        
        # Flush final para asegurar que todos los mensajes se envíen
        producer.flush()
        logger.info(f"✅ {ruta_archivo}: {total_registros} registros procesados y enviados a Kafka y MongoDB")
        return total_registros
        
    except Exception as e:
        logger.error(f"❌ Error procesando {ruta_archivo}: {e}")
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
            'archivo': os.path.join(DATA_DIR, 'subterraneos', 'EM310-UDL-915M soterrados nov 2024.csv'),
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
    
    total_general = 0
    
    # Procesar cada archivo de sensores
    for config in archivos_config:
        archivo = config['archivo']
        tipo = config['tipo']
        descripcion = config['descripcion']
        
        logger.info(f"🎯 {descripcion}")
        total_archivo = procesar_csv_sensores(archivo, tipo)
        total_general += total_archivo
        logger.info("-" * 50)
    
    # Cerrar conexiones
    producer.close()
    if mongo_client:
        mongo_client.close()
        logger.info("✅ Conexión a MongoDB cerrada")
    
    logger.info(f"🎯 INGESTA COMPLETADA - Total: {total_general} registros")
    logger.info("📊 Puedes ver los datos en:")
    logger.info("   - Kafka UI: http://localhost:8080")
    logger.info("   - MongoDB Atlas: cluster0.e0tjitb.mongodb.net (Base: sensores_iot)")
    logger.info("🌐 Ejecuta la API con: python api_sensores.py")