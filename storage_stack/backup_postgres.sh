#!/bin/bash
# Script para hacer backup de PostgreSQL
# Uso: ./backup_postgres.sh

BACKUP_FILE="backup_postgres_$(date +%Y%m%d_%H%M%S).sql"

echo "Exportando datos de PostgreSQL..."
docker exec storage_stack-postgres-1 pg_dump -U postgres iot > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado: $BACKUP_FILE"
    echo "Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Error al crear backup"
    exit 1
fi

