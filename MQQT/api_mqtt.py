from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
import json
from datetime import datetime
import logging
from collections import deque

app = Flask(__name__)
CORS(app)

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Usar deque para almacenar los últimos N mensajes de forma eficiente y thread-safe
MAX_MESSAGES = 200
ultimos_mensajes = deque(maxlen=MAX_MESSAGES)

def on_connect(client, userdata, flags, rc):
    """Callback que se ejecuta cuando el cliente se conecta al broker MQTT."""
    if rc == 0:
        logger.info("✅ API conectada al broker MQTT. Suscribiendo a 'sensores/#'...")
        client.subscribe("sensores/#")
    else:
        logger.error(f"❌ Error de conexión MQTT para la API: código {rc}")

def on_message(client, userdata, msg):
    """Callback que se ejecuta cuando llega un mensaje."""
    try:
        payload = json.loads(msg.payload.decode('utf-8'))
        mensaje = {
            'topic': msg.topic,
            'timestamp_api': datetime.now().isoformat(),
            'data': payload
        }
        ultimos_mensajes.append(mensaje)
        logger.debug(f"📨 Mensaje recibido en topic {msg.topic} y almacenado.")
    except json.JSONDecodeError:
        logger.warning(f"⚠️ No se pudo decodificar el JSON del topic {msg.topic}")
    except Exception as e:
        logger.error(f"❌ Error procesando mensaje MQTT: {e}")

# Configurar MQTT para la API
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

@app.route('/api/mqtt/sensores', methods=['GET'])
def get_sensores():
    """Endpoint para obtener los últimos mensajes de sensores recibidos vía MQTT."""
    limit = request.args.get('limit', 20, type=int)
    
    # Convertir deque a lista para poder hacer slicing y serializar a JSON
    mensajes_a_enviar = list(ultimos_mensajes)
    
    return jsonify({
        'total_mensajes': len(ultimos_mensajes),
        'limit': limit,
        'mensajes': mensajes_a_enviar[-limit:]  # Devolver los últimos 'limit' mensajes
    })

if __name__ == '__main__':
    logger.info("🔌 Conectando cliente MQTT para la API...")
    mqtt_client.connect("localhost", 1883, 60)
    mqtt_client.loop_start()
    logger.info("🚀 Iniciando servidor Flask para la API MQTT en el puerto 5001...")
    app.run(debug=True, port=5001, use_reloader=False)