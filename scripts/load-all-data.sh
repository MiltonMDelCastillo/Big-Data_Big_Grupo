#!/bin/bash
# scripts/load-all-data.sh

echo "=== CARGA MASIVA DE DATOS DE SENSORES ==="

# Activar entorno virtual (si tienes)
# source venv/bin/activate

# Ejecutar producer unificado
python csv-producers/unified-producer/main.py

echo "✅ Carga completada"
echo "📊 Para monitorear: http://localhost:9000"