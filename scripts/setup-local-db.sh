#!/bin/bash

# Script para configurar PostgreSQL Local para Hersis FS API
# Uso: ./scripts/setup-local-db.sh

set -e

echo "🔧 Configurando PostgreSQL Local para Hersis FS API..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables de configuración (tomar de .env.local si existe)
DB_NAME="hersis_fs_db"
DB_USER="postgres"
DB_PASSWORD="HersisFS20241106"
DB_HOST="localhost"
DB_PORT="5432"

# Verificar si PostgreSQL está instalado
echo "📋 Verificando instalación de PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL no está instalado.${NC}"
    echo "Por favor instala PostgreSQL primero:"
    echo "  - macOS: brew install postgresql@14"
    echo "  - Linux: sudo apt-get install postgresql-14"
    echo "  - Windows: Descarga desde https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL está instalado${NC}"
echo ""

# Verificar si PostgreSQL está corriendo
echo "📋 Verificando si PostgreSQL está corriendo..."
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL no está corriendo${NC}"
    echo "Intentando iniciar PostgreSQL..."
    
    # Intentar iniciar según el sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql@14 || brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start postgresql
    else
        echo -e "${RED}❌ No se pudo iniciar PostgreSQL automáticamente${NC}"
        echo "Por favor, inicia PostgreSQL manualmente."
        exit 1
    fi
    
    # Esperar a que PostgreSQL esté listo
    echo "Esperando a que PostgreSQL esté listo..."
    sleep 3
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        echo -e "${RED}❌ PostgreSQL no está respondiendo${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"
echo ""

# Verificar si la base de datos ya existe
echo "📋 Verificando si la base de datos existe..."
if psql -U $DB_USER -h $DB_HOST -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  La base de datos '$DB_NAME' ya existe${NC}"
    read -p "¿Deseas eliminarla y recrearla? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Eliminando base de datos existente..."
        psql -U $DB_USER -h $DB_HOST -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "Manteniendo base de datos existente..."
        echo ""
        echo -e "${GREEN}✅ Configuración completada${NC}"
        exit 0
    fi
fi

# Crear la base de datos
echo "🗄️  Creando base de datos '$DB_NAME'..."
psql -U $DB_USER -h $DB_HOST -c "CREATE DATABASE $DB_NAME;" || {
    echo -e "${RED}❌ Error al crear la base de datos${NC}"
    exit 1
}

echo -e "${GREEN}✅ Base de datos creada${NC}"
echo ""

# Otorgar privilegios
echo "🔐 Otorgando privilegios al usuario '$DB_USER'..."
psql -U $DB_USER -h $DB_HOST -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${GREEN}✅ Privilegios otorgados${NC}"
echo ""

# Ejecutar script de migración si existe
if [ -f "migrate-decimal-columns.sql" ]; then
    echo "📝 Ejecutando script de migración..."
    psql -U $DB_USER -h $DB_HOST -d $DB_NAME -f migrate-decimal-columns.sql || {
        echo -e "${YELLOW}⚠️  Error al ejecutar el script de migración (esto puede ser normal si es la primera vez)${NC}"
    }
    echo ""
fi

# Configurar archivo .env
echo "⚙️  Configurando archivo .env..."
if [ -f ".env.local" ]; then
    cp .env.local .env
    echo -e "${GREEN}✅ Archivo .env configurado desde .env.local${NC}"
else
    echo -e "${YELLOW}⚠️  Archivo .env.local no encontrado${NC}"
    echo "Por favor, asegúrate de que tu archivo .env tenga las siguientes variables:"
    echo ""
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_NAME=$DB_NAME"
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=$DB_PORT"
    echo "DB_USERNAME=$DB_USER"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ PostgreSQL Local configurado correctamente${NC}"
echo "================================================"
echo ""
echo "📊 Detalles de la conexión:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo ""
echo "🚀 Para iniciar la aplicación:"
echo "  pnpm install"
echo "  pnpm run start:dev"
echo ""
echo "🔍 Para conectarte a la base de datos:"
echo "  psql -U $DB_USER -h $DB_HOST -d $DB_NAME"
echo ""
