#!/bin/bash
# infra/stop-services.sh

echo "🛑 Deteniendo servicios Kafka..."

docker-compose down

echo "✅ Servicios detenidos"