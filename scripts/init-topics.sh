#!/bin/bash
# scripts/init-topics.sh

KAFKA_HOST="localhost:9092"

# Crear topics para los 3 tipos de sensores
declare -a topics=("sensores-soterrados" "sensores-sonido" "sensores-aire")

for topic in "${topics[@]}"; do
    kafka-topics.sh --create \
        --bootstrap-server $KAFKA_HOST \
        --topic $topic \
        --partitions 1 \
        --replication-factor 1
    
    echo "Topic creado: $topic"
done

# Listar todos los topics
echo -e "\n📋 Topics disponibles:"
kafka-topics.sh --list --bootstrap-server $KAFKA_HOST