# Script para migrar datos a MongoDB Atlas
# Uso: .\migrate_to_atlas.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

Write-Host "🚀 Migración a MongoDB Atlas" -ForegroundColor Cyan
Write-Host ""

# Verificar que MongoDB local esté corriendo
Write-Host "📋 Verificando MongoDB local..." -ForegroundColor Yellow
$mongoRunning = docker ps --filter "name=storage_stack-mongo-1" --format "{{.Names}}"
if (-not $mongoRunning) {
    Write-Host "⚠️  MongoDB local no está corriendo. Iniciando..." -ForegroundColor Yellow
    docker start storage_stack-mongo-1
    Start-Sleep -Seconds 5
}

# Paso 1: Backup
Write-Host "📦 Paso 1: Creando backup de MongoDB local..." -ForegroundColor Yellow
$backupDir = "backup_mongo_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
docker exec storage_stack-mongo-1 mongodump --uri="mongodb://localhost:27017" --db=iot --out="./$backupDir"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al crear backup" -ForegroundColor Red
    exit 1
}

$size = (Get-ChildItem $backupDir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "✅ Backup creado: $backupDir ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Paso 2: Verificar MongoDB Database Tools
Write-Host "🔍 Paso 2: Verificando MongoDB Database Tools..." -ForegroundColor Yellow
$mongorestore = Get-Command mongorestore -ErrorAction SilentlyContinue

if (-not $mongorestore) {
    Write-Host "⚠️  MongoDB Database Tools no está instalado." -ForegroundColor Yellow
    Write-Host "   Descarga desde: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Cyan
    Write-Host "   O usa MongoDB Compass para importar manualmente." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Backup listo en: $backupDir" -ForegroundColor Green
    Write-Host "   Puedes importarlo manualmente usando MongoDB Compass" -ForegroundColor Cyan
    exit 0
}

# Paso 3: Importar a Atlas
Write-Host "📤 Paso 3: Importando datos a MongoDB Atlas..." -ForegroundColor Yellow
Write-Host "   Connection String: $($ConnectionString.Substring(0, [Math]::Min(50, $ConnectionString.Length)))..." -ForegroundColor Gray

mongorestore --uri="$ConnectionString" "$backupDir/iot"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Migración completada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Actualiza tu archivo .env con:" -ForegroundColor Yellow
    Write-Host "      MONGO_URI=$ConnectionString" -ForegroundColor White
    Write-Host "   2. Prueba la conexión con: python test_atlas_connection.py" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Error al importar datos" -ForegroundColor Red
    Write-Host "   Verifica que:" -ForegroundColor Yellow
    Write-Host "   - El connection string sea correcto" -ForegroundColor Yellow
    Write-Host "   - Tu IP esté en la whitelist de Atlas" -ForegroundColor Yellow
    Write-Host "   - Las credenciales sean correctas" -ForegroundColor Yellow
    exit 1
}

