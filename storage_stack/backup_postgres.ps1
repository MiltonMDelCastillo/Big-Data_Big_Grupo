# Script para hacer backup de PostgreSQL (PowerShell)
# Uso: .\backup_postgres.ps1

$backupFile = "backup_postgres_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "Exportando datos de PostgreSQL..." -ForegroundColor Yellow

docker exec storage_stack-postgres-1 pg_dump -U postgres iot | Out-File -FilePath $backupFile -Encoding utf8

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
    Write-Host "Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error al crear backup" -ForegroundColor Red
    exit 1
}

