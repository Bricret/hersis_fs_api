# Script para configurar PostgreSQL Local para Hersis FS API en Windows
# Uso: .\scripts\setup-local-db.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔧 Configurando PostgreSQL Local para Hersis FS API..." -ForegroundColor Cyan
Write-Host ""

# Variables de configuración
$DB_NAME = "hersis_fs_db"
$DB_USER = "postgres"
$DB_PASSWORD = "HersisFS20241106"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Verificar si PostgreSQL está instalado
Write-Host "📋 Verificando instalación de PostgreSQL..." -ForegroundColor Yellow
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL está instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL no está instalado." -ForegroundColor Red
    Write-Host "Por favor instala PostgreSQL desde: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar si PostgreSQL está corriendo
Write-Host "📋 Verificando si PostgreSQL está corriendo..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "❌ No se encontró el servicio de PostgreSQL" -ForegroundColor Red
    Write-Host "Por favor, verifica que PostgreSQL esté instalado correctamente." -ForegroundColor Yellow
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL no está corriendo. Intentando iniciar..." -ForegroundColor Yellow
    try {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "✅ PostgreSQL iniciado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ No se pudo iniciar PostgreSQL automáticamente" -ForegroundColor Red
        Write-Host "Por favor, inicia el servicio de PostgreSQL manualmente desde Servicios de Windows." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
}

Write-Host ""

# Configurar PGPASSWORD para no tener que ingresar la contraseña cada vez
$env:PGPASSWORD = $DB_PASSWORD

# Verificar si la base de datos ya existe
Write-Host "📋 Verificando si la base de datos existe..." -ForegroundColor Yellow
$dbExists = & psql -U $DB_USER -h $DB_HOST -lqt | Select-String -Pattern $DB_NAME -Quiet

if ($dbExists) {
    Write-Host "⚠️  La base de datos '$DB_NAME' ya existe" -ForegroundColor Yellow
    $response = Read-Host "¿Deseas eliminarla y recrearla? (s/N)"
    
    if ($response -match "^[Ss]$") {
        Write-Host "Eliminando base de datos existente..." -ForegroundColor Yellow
        & psql -U $DB_USER -h $DB_HOST -c "DROP DATABASE IF EXISTS $DB_NAME;"
    } else {
        Write-Host "Manteniendo base de datos existente..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "✅ Configuración completada" -ForegroundColor Green
        exit 0
    }
}

# Crear la base de datos
Write-Host "🗄️  Creando base de datos '$DB_NAME'..." -ForegroundColor Yellow
try {
    & psql -U $DB_USER -h $DB_HOST -c "CREATE DATABASE $DB_NAME;"
    Write-Host "✅ Base de datos creada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al crear la base de datos" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Otorgar privilegios
Write-Host "🔐 Otorgando privilegios al usuario '$DB_USER'..." -ForegroundColor Yellow
& psql -U $DB_USER -h $DB_HOST -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
Write-Host "✅ Privilegios otorgados" -ForegroundColor Green
Write-Host ""

# Ejecutar script de migración si existe
if (Test-Path "migrate-decimal-columns.sql") {
    Write-Host "📝 Ejecutando script de migración..." -ForegroundColor Yellow
    try {
        & psql -U $DB_USER -h $DB_HOST -d $DB_NAME -f migrate-decimal-columns.sql
    } catch {
        Write-Host "⚠️  Error al ejecutar el script de migración (esto puede ser normal si es la primera vez)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Configurar archivo .env
Write-Host "⚙️  Configurando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env" -Force
    Write-Host "✅ Archivo .env configurado desde .env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env.local no encontrado" -ForegroundColor Yellow
    Write-Host "Por favor, asegúrate de que tu archivo .env tenga las siguientes variables:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DB_PASSWORD=$DB_PASSWORD"
    Write-Host "DB_NAME=$DB_NAME"
    Write-Host "DB_HOST=$DB_HOST"
    Write-Host "DB_PORT=$DB_PORT"
    Write-Host "DB_USERNAME=$DB_USER"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ PostgreSQL Local configurado correctamente" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Detalles de la conexión:" -ForegroundColor Cyan
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  Username: $DB_USER"
Write-Host ""
Write-Host "🚀 Para iniciar la aplicación:" -ForegroundColor Cyan
Write-Host "  pnpm install"
Write-Host "  pnpm run start:dev"
Write-Host ""
Write-Host "🔍 Para conectarte a la base de datos:" -ForegroundColor Cyan
Write-Host "  psql -U $DB_USER -h $DB_HOST -d $DB_NAME"
Write-Host ""

# Limpiar la variable de entorno de contraseña
Remove-Item Env:\PGPASSWORD
