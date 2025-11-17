import paho.mqtt.client as mqtt
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Almacenar datos recibidos
datos_recibidos = []

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("✅ Conectado al broker MQTT")
        # Suscribirse a todos los topics de sensores
        client.subscribe("sensores/#")
        logger.info("📡 Suscrito a: sensores/#")
    else:
        logger.error(f"❌ Error conexión: {rc}")

def on_message(client, userdata, msg):
    """Callback cuando llega un mensaje MQTT"""
    try:
        payload = json.loads(msg.payload.decode())
        datos_recibidos.append({
            'timestamp': datetime.now().isoformat(),
            'topic': msg.topic,
            'tipo_sensor': payload.get('tipo_sensor'),
            'id_unico': payload.get('id_unico'),
            'datos': payload.get('datos_crudos', {})
        })
        
        logger.info(f"📨 [{msg.topic}] {payload.get('id_unico')}")
        
        # Mostrar cada 10 mensajes
        if len(datos_recibidos) % 10 == 0:
            logger.info(f"📊 Total mensajes recibidos: {len(datos_recibidos)}")
            
    except Exception as e:
        logger.error(f"❌ Error procesando mensaje: {e}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    client.connect("localhost", 1883, 60)
    logger.info("👂 Escuchando mensajes MQTT... (Ctrl+C para detener)")
    
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info(f"🛑 Detenido. Total mensajes: {len(datos_recibidos)}")
    finally:
        client.disconnect()

if __name__ == "__main__":
    main()