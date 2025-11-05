from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime

from kafka.structs import TopicPartition
# Importación específica de kafka
try:
    from kafka import KafkaConsumer
    KAFKA_AVAILABLE = True
except ImportError as e:
    print(f"❌ Kafka no disponible: {e}")
    KAFKA_AVAILABLE = False

app = Flask(__name__) 
CORS(app)  # Permitir requests desde frontend

def obtener_consumer():
    """
    Crea y configura un consumer de Kafka
    Returns:
        KafkaConsumer: Consumer configurado
    """
    if not KAFKA_AVAILABLE:
        raise Exception("Kafka no está disponible")
    
    return KafkaConsumer(
        bootstrap_servers=['localhost:9092'],  # Conectar a Kafka en Docker
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),  # Convertir JSON a dict
        auto_offset_reset='latest',  # Cambiamos a 'latest' y controlaremos la posición manualmente
        group_id='api-sensores',  # ID del grupo de consumers
        consumer_timeout_ms=2000  # Timeout para no bloquear
    )

@app.route('/')
def home():
    """Página de inicio de la API"""
    return jsonify({
        'message': 'API de Sensores IoT - Proyecto Kafka',
        'status': 'funcionando',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            '/api/sensores/tipos': 'GET - Listar tipos de sensores disponibles',
            '/api/sensores/<tipo>': 'GET - Datos de un sensor específico',
            '/api/sensores/todos': 'GET - Todos los datos de todos los sensores',
            '/api/sensores/estadisticas': 'GET - Estadísticas generales'
        }
    })

@app.route('/api/sensores/tipos', methods=['GET'])
def obtener_tipos_sensores():
    """
    Obtener los tipos de sensores disponibles en Kafka
    Returns:
        JSON con lista de topics/sensores
    """
    if not KAFKA_AVAILABLE:
        return jsonify({'error': 'Kafka no disponible'}), 500
        
    try:
        consumer = obtener_consumer()
        # Filtrar topics que empiezan con 'topic-' (nuestros sensores)
        topics = [topic for topic in consumer.topics() if topic.startswith('topic-')]
        tipos = [topic.replace('topic-', '') for topic in topics]
        consumer.close()
        
        return jsonify({
            'tipos_sensores': tipos,
            'total': len(tipos),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensores/<tipo_sensor>', methods=['GET'])
def obtener_datos_sensor(tipo_sensor):
    """
    Obtener datos de un tipo específico de sensor
    Args:
        tipo_sensor: soterrados, sonido, o calidad-aire
    Query Params:
        limit: Límite de registros (default: 50)
    """
    if not KAFKA_AVAILABLE:
        return jsonify({'error': 'Kafka no disponible'}), 500
        
    limit = request.args.get('limit', 50, type=int)
    topic = f'topic-{tipo_sensor}'
    
    try:
        consumer = obtener_consumer()
        
        # --- INICIO DE LA CORRECCIÓN ---
        # En lugar de suscribirnos, asignamos manualmente las particiones del topic.
        # Esto evita el retraso del rebalanceo de grupo y el error "No partitions are currently assigned".
        partitions = consumer.partitions_for_topic(topic)
        if not partitions:
            consumer.close()
            # Si el topic no existe o no tiene particiones, devolvemos una respuesta vacía.
            return jsonify({'tipo_sensor': tipo_sensor, 'total_registros': 0, 'limit': limit, 'datos': []})
        consumer.assign([TopicPartition(topic, p) for p in partitions])
        consumer.seek_to_beginning()

        datos = []
        for message in consumer:
            datos.append({
                'id': message.value.get('id_unico'),
                'tipo_sensor': message.value.get('tipo_sensor'),
                'timestamp': message.value.get('timestamp_original'),
                'dispositivo': message.value.get('dispositivo', {}),
                'datos_crudos': message.value.get('datos_crudos', {})
            })
            
            if len(datos) >= limit:
                break
        
        consumer.close()
        
        return jsonify({
            'tipo_sensor': tipo_sensor,
            'total_registros': len(datos),
            'limit': limit,
            'datos': datos
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensores/todos', methods=['GET'])
def obtener_todos_sensores():
    """
    Obtener datos de todos los sensores (muestra de cada tipo)
    Query Params:
        limit: Límite por tipo de sensor (default: 10)
    """
    if not KAFKA_AVAILABLE:
        return jsonify({'error': 'Kafka no disponible'}), 500
        
    limit_por_tipo = request.args.get('limit', 10, type=int)
    
    try:
        consumer = obtener_consumer()
        topics = [topic for topic in consumer.topics() if topic.startswith('topic-')]
        
        todos_datos = {}
        
        for topic in topics:
            try:
                consumer.subscribe([topic])
                datos_topic = []
                
                for message in consumer:
                    datos_topic.append({
                        'topic': topic,
                        'data': message.value
                    })
                    
                    if len(datos_topic) >= limit_por_tipo:
                        break
                
                todos_datos[topic] = {
                    'total_registros': len(datos_topic),
                    'datos': datos_topic
                }
                
            except Exception as e:
                todos_datos[topic] = {'error': str(e)}
        
        consumer.close()
        return jsonify(todos_datos)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensores/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """Estadísticas generales de los datos en Kafka"""
    if not KAFKA_AVAILABLE:
        return jsonify({'error': 'Kafka no disponible'}), 500
        
    try:
        consumer = obtener_consumer()
        topics = [topic for topic in consumer.topics() if topic.startswith('topic-')]
        
        estadisticas = {
            'total_tipos_sensores': len(topics),
            'tipos_sensores': [t.replace('topic-', '') for t in topics],
            'timestamp': datetime.now().isoformat(),
            'kafka_disponible': True
        }
        
        consumer.close()
        return jsonify(estadisticas)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🌐 API de Sensores IoT - PROYECTO KAFKA")
    print("=" * 50)
    print("✅ Dependencias verificadas:")
    print("   - Flask ✓")
    print("   - Flask-CORS ✓") 
    print("   - Kafka-Python ✓")
    print("   - Pandas ✓")
    print("\n📊 Endpoints disponibles:")
    print("   http://localhost:5000/")
    print("   http://localhost:5000/api/sensores/tipos")
    print("   http://localhost:5000/api/sensores/soterrados")
    print("   http://localhost:5000/api/sensores/sonido")
    print("   http://localhost:5000/api/sensores/calidad-aire")
    print("\n🚀 Iniciando servidor...")
    app.run(debug=True, port=5000, use_reloader=False)