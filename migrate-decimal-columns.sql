-- Script de migración para convertir columnas unit_price y subtotal a decimal
-- Ejecutar este script en el contenedor de PostgreSQL

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
-- Esta migración preserva todos los datos existentes
ALTER TABLE sale_details 
ALTER COLUMN unit_price TYPE DECIMAL(10,2) 
USING unit_price::DECIMAL(10,2);

-- Migrar columna subtotal a decimal(10,2)
-- Esta migración preserva todos los datos existentes
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

-- Comentario: Las columnas ahora soportan decimales con 2 lugares decimales
-- Ejemplo: 123.45, 1000.00, 0.99 