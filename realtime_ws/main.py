from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_socketio import SocketIO
from kafka import KafkaProducer, errors as kafka_errors
from pymongo import MongoClient
import os
import json
import time
import logging

# -----------------------------------------
# Configuración
# -----------------------------------------
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "sensores_iot")
MONGO_COLLECTION = os.environ.get("MONGO_COLLECTION", "sensores_ingesta")

KAFKA_BOOTSTRAP = os.environ.get("KAFKA_BOOTSTRAP", "localhost:9092")
KAFKA_TOPIC = os.environ.get("KAFKA_TOPIC", "topic-sensores")

# Flask + SocketIO
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------------
# Inicializar MongoDB
# -----------------------------------------
mongo = MongoClient(MONGO_URI)
db = mongo[MONGO_DB]
collection = db[MONGO_COLLECTION]

# -----------------------------------------
# Kafka Producer (opcional)
# -----------------------------------------
producer = None
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        compression_type="gzip",
        retries=3,
        linger_ms=50,
    )
    logger.info("✔ Kafka conectado")
except Exception as e:
    logger.warning(f"⚠ Kafka no disponible, servidor funcionará sin Kafka. Detalle: {e}")
    producer = None


# -----------------------------------------
# Validación del JSON recibido
# -----------------------------------------
def validate_payload(payload):
    required = ["sensor_id", "timestamp", "type", "value", "unit", "location"]
    missing = [r for r in required if r not in payload]

    if missing:
        return False, f"Campos faltantes: {', '.join(missing)}"
    return True, None


# -----------------------------------------
# Endpoint principal (POST)
# -----------------------------------------
@app.route("/api/sensores", methods=["POST"])
def create_sensor():
    try:
        payload = request.get_json(force=True)
    except Exception as e:
        return jsonify({"ok": False, "error": "invalid_json", "message": str(e)}), 400

    ok, err = validate_payload(payload)
    if not ok:
        return jsonify({"ok": False, "error": "validation", "message": err}), 400

    payload["_ingest_received_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Guardar en MongoDB
    try:
        insert_res = collection.insert_one(payload)
        inserted_id = str(insert_res.inserted_id)
    except Exception as e:
        return jsonify({"ok": False, "error": "mongodb_insert", "message": str(e)}), 500

    # Enviar a Kafka si existe
    if producer:
        try:
            producer.send(KAFKA_TOPIC, payload)
        except Exception as e:
            logger.error(f"Error enviando a Kafka: {e}")

    # Emitir por WebSocket
    try:
        socketio.emit("new_measurement", payload, broadcast=True)
    except Exception as e:
        logger.error(f"Error WebSocket: {e}")

    return jsonify({"ok": True, "inserted_id": inserted_id}), 201


# -----------------------------------------
# Dashboard HTML
# -----------------------------------------
@app.route("/")
def dashboard():
    return render_template("dashboard.html")


# -----------------------------------------
# Health Check
# -----------------------------------------
@app.route("/health")
def health():
    return jsonify({"ok": True})


# -----------------------------------------
# Ejecutar servidor
# -----------------------------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
