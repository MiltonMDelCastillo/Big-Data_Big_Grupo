import paho.mqtt.client as mqtt
import pandas as pd
import json
import os
import time
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuración MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# Topics MQTT para cada tipo de sensor
MQTT_TOPICS = {
    'soterrados': 'sensores/soterrados/data',
    'sonido': 'sensores/sonido/data', 
    'calidad-aire': 'sensores/calidad-aire/data'
}

def on_connect(client, userdata, flags, rc):
    """Callback cuando se conecta al broker MQTT"""
    if rc == 0:
        logger.info("✅ Conectado al broker MQTT")
    else:
        logger.error(f"❌ Error conectando MQTT: código {rc}")

def on_publish(client, userdata, mid):
    """Callback cuando se publica un mensaje"""
    logger.debug(f"📤 Mensaje publicado con ID: {mid}")

def procesar_csv_mqtt(client, ruta_archivo, tipo_sensor):
    """
    Procesa CSV y envía los datos via MQTT (similar al producer de Kafka)
    
    Args:
        client: Cliente MQTT
        ruta_archivo (str): Ruta al archivo CSV
        tipo_sensor (str): Tipo de sensor
    """
    try:
        if not os.path.exists(ruta_archivo):
            logger.error(f"❌ Archivo no encontrado: {ruta_archivo}")
            return 0
            
        chunk_size = 1000  # Procesar en lotes
        total_registros = 0
        topic = MQTT_TOPICS[tipo_sensor]
        
        logger.info(f"📂 Procesando: {ruta_archivo} como {tipo_sensor}")
        logger.info(f"   📡 Enviando a topic MQTT: {topic}")
        
        # Leer CSV por chunks
        for chunk_num, chunk in enumerate(pd.read_csv(ruta_archivo, chunksize=chunk_size)):
            logger.info(f"   📦 Chunk {chunk_num} - {len(chunk)} registros")
            
            # Procesar cada fila
            for idx, fila in chunk.iterrows():
                try:
                    # Mismo formato que usamos en Kafka
                    mensaje = {
                        'id_unico': f"mqtt_{tipo_sensor}_{fila.get('_id', idx)}_{total_registros}",
                        'tipo_sensor': tipo_sensor,
                        'timestamp_original': fila.get('time'),
                        'timestamp_ingesta': datetime.now().isoformat(),
                        'fuente_archivo': os.path.basename(ruta_archivo),
                        
                        # Metadata del dispositivo
                        'dispositivo': {
                            'deviceName': fila.get('deviceInfo.deviceName'),
                            'devEui': fila.get('deviceInfo.devEui'),
                            'devAddr': fila.get('devAddr'),
                            'applicationName': fila.get('deviceInfo.applicationName'),
                        },
                        
                        # Todos los datos crudos
                        'datos_crudos': {k: v for k, v in fila.replace({pd.NA: None}).to_dict().items() if v is not None}
                    }
                    
                    # Publicar via MQTT (en lugar de Kafka)
                    client.publish(topic, json.dumps(mensaje, default=str))
                    total_registros += 1
                    
                    # Pequeña pausa para no saturar
                    if total_registros % 500 == 0:
                        logger.info(f"   📤 Enviados {total_registros} mensajes MQTT...")
                        time.sleep(0.1)  # Pausa breve
                        
                except Exception as e:
                    logger.error(f"❌ Error en fila {idx}: {e}")
                    continue
        
        logger.info(f"✅ {ruta_archivo}: {total_registros} mensajes enviados via MQTT")
        return total_registros
        
    except Exception as e:
        logger.error(f"❌ Error procesando {ruta_archivo}: {e}")
        return 0

def main():
    """Función principal - INGESTA MQTT"""
    # Crear cliente MQTT
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        # Conectar al broker MQTT
        logger.info(f"🔌 Conectando a MQTT {MQTT_BROKER}:{MQTT_PORT}")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        # Esperar que se establezca la conexión
        time.sleep(2)
        
        logger.info("🚀 INICIANDO INGESTA DE DATOS CSV VIA MQTT")
        logger.info("=" * 60)
        
        # CONFIGURACIÓN DE ARCHIVOS (igual que en Kafka)
        archivos_config = [
            {
                'archivo': '../data/EM310-UDL-915M soterrados nov 2024.csv', 
                'tipo': 'soterrados',
                'descripcion': 'Sensores de nivel de líquido'
            },
            {
                'archivo': '../data/WS302-915M SONIDO NOV 2024.csv', 
                'tipo': 'sonido',
                'descripcion': 'Sensores de medición de decibeles'
            },
            {
                'archivo': '../data/EM500-CO2-915M nov 2024.csv', 
                'tipo': 'calidad-aire',
                'descripcion': 'Sensores de CO2, temperatura, humedad'
            }
        ]
        
        total_general = 0
        
        # Procesar cada archivo
        for config in archivos_config:
            archivo = config['archivo']
            tipo = config['tipo']
            descripcion = config['descripcion']
            
            logger.info(f"🎯 {descripcion}")
            total_archivo = procesar_csv_mqtt(client, archivo, tipo)
            total_general += total_archivo
            logger.info("-" * 50)
        
        logger.info(f"🎯 INGESTA MQTT COMPLETADA - Total: {total_general} mensajes")
        logger.info("📊 Puedes ver los mensajes en MQTT UI: http://localhost:8081")
        
        # Mantener conexión unos segundos más
        time.sleep(5)
        
    except Exception as e:
        logger.error(f"❌ Error en ingesta MQTT: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        logger.info("🔚 Cliente MQTT desconectado")

if __name__ == "__main__":
    main()