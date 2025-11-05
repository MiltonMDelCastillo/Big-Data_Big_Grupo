#!/bin/bash
# Script para hacer backup de MongoDB
# Uso: ./backup_mongo.sh

BACKUP_DIR="backup_mongo_$(date +%Y%m%d_%H%M%S)"

echo "Exportando datos de MongoDB..."
docker exec storage_stack-mongo-1 mongodump --uri="mongodb://localhost:27017" --db=iot --out="./$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado en: $BACKUP_DIR"
    echo "Tamaño: $(du -sh $BACKUP_DIR | cut -f1)"
else
    echo "❌ Error al crear backup"
    exit 1
fi

