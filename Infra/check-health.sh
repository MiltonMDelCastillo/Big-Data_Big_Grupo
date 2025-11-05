#!/bin/bash
# infra/check-health.sh

echo "🏥 Verificando salud de los servicios..."

# Verificar Zookeeper
echo "🔍 Zookeeper:"
docker-compose exec zookeeper zkServer.sh status

# Verificar Kafka
echo "🔍 Kafka:"
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Verificar conectividad
echo "🔍 Conectividad:"
nc -z localhost 2181 && echo "✅ Zookeeper (2181) - OK" || echo "❌ Zookeeper (2181) - FAIL"
nc -z localhost 9092 && echo "✅ Kafka (9092) - OK" || echo "❌ Kafka (9092) - FAIL"
nc -z localhost 9000 && echo "✅ Kafdrop (9000) - OK" || echo "❌ Kafdrop (9000) - FAIL"

echo "📊 URLs de monitoreo:"
echo "   - Kafdrop: http://localhost:9000"
echo "   - Control Center: http://localhost:9021"