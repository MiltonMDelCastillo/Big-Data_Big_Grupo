Sistema de Ingesta en Tiempo Real con Kafka + API REST 

 

Este módulo implementa un pipeline de ingesta en tiempo real utilizando: 

API REST (Python – Flask/FastAPI) 

Apache Kafka (productor/consumidor) 

Docker + Docker Compose 

Postman para pruebas 

Procesamiento en vivo 

El objetivo es recibir datos desde sensores, enviarlos a Kafka y procesarlos en tiempo real. 

0) Requisitos Previos 

Asegúrate de tener instalado: 

Docker + Docker Desktop 

Python 3.10+ 

Postman (opcional, para pruebas) 

VS Code u otro editor 

(Opcional) Kafka UI 

1) Clonar y Configurar el Proyecto 

# Copiar módulo dentro del proyecto principal 
cp -r realtime_kafka ./integranteX_realtime 
cd integranteX_realtime 

Crear archivo .env: 

cp .env.example .env 

Variables por defecto: 

KAFKA_BROKER=localhost:9092 
TOPIC_NAME=sensor_data 
API_PORT=5000 

Edita si deseas cambiar valores. 

2) Levantar Kafka con Docker 

Ejecuta: 

docker compose up -d 

Esto inicia: 

Zookeeper 

Kafka Broker 

Kafka UI (si está configurado) 

Verifica que está corriendo: 

docker ps 
 

3) Ejecutar la API REST 

Crear entorno virtual: 

python -m venv venv 
source venv/bin/activate      # Windows: venv\Scripts\activate 

Instalar dependencias: 

pip install -r requirements.txt 

Iniciar la API: 

python main.py 
 

Salida esperada: 

Running on http://127.0.0.1:5000 
Running on http://0.0.0.0:5000 

 
 
 

4) Probar la API con Postman 

Abre Postman → Create Request → Método POST 

URL: 

http://127.0.0.1:5000/sensor 

Body → raw → JSON 

{ 
 "sensor_id": "sensor01", 
 "timestamp": "2025-11-17T14:20:00Z", 
 "type": "temperature", 
 "value": 25.3, 
 "unit": "C", 
 "location": "lab" 
} 

✔ La API recibe los datos 
✔ Los envía a Kafka 

🎧 5) Ejecutar el Consumer de Kafka 

En otra terminal: 

python consumer.py 

Salida esperada: 

Listening to topic: sensor_data 
Message received: {"sensor_id":"sensor01","value":25.3,...} 

6) Flujo Completo del Sistema 

[Cliente/Postman/App] 
         ↓ 
  API Python (Producer) 
         ↓ 
      Kafka Topic 
         ↓ 
  Consumer en Python 
         ↓ 
  BD / Dashboards / Procesamiento 

7) Problemas Comunes y Soluciones 

ECONNREFUSED 127.0.0.1:5000 

Solución: 

Verifica que la API esté encendida 

Usa la IP que aparece en consola (a veces cambia) 

Kafka no conecta 

Solución: 

docker compose logs kafka 

 
8) Criterios de Aceptación (Performance) 

API debe aceptar ≥ 100 req/s 

Kafka debe recibir todos los mensajes sin pérdida 

Latencia total del pipeline < 200 ms 

Consumer debe procesar en tiempo real 

Servicios deben funcionar con Docker o localmente 

 

9) Extensiones Opcionales 

Puedes integrar: 

Almacenamiento en PostgreSQL, MongoDB o TimescaleDB 

Dashboard con Grafana 

Kafka UI para visualizar mensajes 

Autor 

Proyecto desarrollado por [Milton Martinez] 
Universidad del Valle – Ingeniería de Sistemas e Informática 

 
