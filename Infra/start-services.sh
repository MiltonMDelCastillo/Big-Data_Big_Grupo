#!/bin/bash
# infra/start-services.sh

echo "🚀 Iniciando servicios Kafka..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker primero."
    exit 1
fi

# Iniciar servicios
docker-compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

# Verificar estado
echo "📊 Verificando estado de los servicios..."
docker-compose ps

echo "✅ Servicios iniciados:"
echo "   - Kafka: localhost:9092"
echo "   - Zookeeper: localhost:2181" 
echo "   - Kafdrop UI: http://localhost:9000"
echo "   - Schema Registry: http://localhost:8081"
echo "   - Control Center: http://localhost:9021"