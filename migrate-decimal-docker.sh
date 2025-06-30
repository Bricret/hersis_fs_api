#!/bin/bash

# Script para migrar columnas decimales en PostgreSQL dockerizado
# Asegúrate de que el contenedor esté corriendo antes de ejecutar este script

echo "Iniciando migración de columnas decimales..."

# Verificar que el contenedor esté corriendo
if ! docker ps | grep -q "hersis-fs-db"; then
    echo "Error: El contenedor hersis-fs-db no está corriendo"
    echo "Ejecuta: docker-compose up -d"
    exit 1
fi

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Variables por defecto
DB_NAME=${DB_NAME:-hersis_fs}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

echo "Conectando a la base de datos: $DB_NAME"

# Ejecutar la migración
docker exec -i hersis-fs-db psql -U $DB_USERNAME -d $DB_NAME << 'EOF'

-- Verificar el estado actual de las columnas
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'sale_details' 
AND column_name IN ('unit_price', 'subtotal');

-- Migrar columna unit_price a decimal(10,2)
ALTER TABLE sale_details 
ALTER COLUMN unit_price TYPE DECIMAL(10,2) 
USING unit_price::DECIMAL(10,2);

-- Migrar columna subtotal a decimal(10,2)
ALTER TABLE sale_details 
ALTER COLUMN subtotal TYPE DECIMAL(10,2) 
USING subtotal::DECIMAL(10,2);

-- Verificar el resultado final
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'sale_details' 
AND column_name IN ('unit_price', 'subtotal');

EOF

echo "Migración completada!" 