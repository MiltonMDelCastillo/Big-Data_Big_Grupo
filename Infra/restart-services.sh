#!/bin/bash
# infra/restart-services.sh

echo "🔄 Reiniciando servicios Kafka..."

./stop-services.sh
sleep 5
./start-services.sh

echo "✅ Servicios reiniciados"