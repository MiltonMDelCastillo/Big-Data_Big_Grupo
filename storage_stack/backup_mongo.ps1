# Script para hacer backup de MongoDB (PowerShell)
# Uso: .\backup_mongo.ps1

$backupDir = "backup_mongo_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "Exportando datos de MongoDB..." -ForegroundColor Yellow

docker exec storage_stack-mongo-1 mongodump --uri="mongodb://localhost:27017" --db=iot --out="./$backupDir"

if ($LASTEXITCODE -eq 0) {
    $size = (Get-ChildItem $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "✅ Backup creado en: $backupDir" -ForegroundColor Green
    Write-Host "Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error al crear backup" -ForegroundColor Red
    exit 1
}

