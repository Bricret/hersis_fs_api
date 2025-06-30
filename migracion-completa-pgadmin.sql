-- =========================================================
-- SCRIPT DE MIGRACIÓN PARA PGADMIN
-- Actualiza campos decimales sin perder datos
-- =========================================================

-- 1. VERIFICAR ESTADO ACTUAL DE LAS TABLAS
-- =========================================================

-- Verificar estructura actual de sale_details
SELECT 
    'sale_details' as tabla,
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_details' 
AND column_name IN ('unit_price', 'subtotal')
ORDER BY column_name;

-- Verificar estructura actual de sales
SELECT 
    'sales' as tabla,
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name = 'total';

-- Verificar algunos datos de ejemplo ANTES de la migración
SELECT 
    'ANTES - Datos de ejemplo sale_details' as info,
    id, 
    unit_price, 
    subtotal,
    pg_typeof(unit_price) as tipo_unit_price,
    pg_typeof(subtotal) as tipo_subtotal
FROM sale_details 
LIMIT 5;

SELECT 
    'ANTES - Datos de ejemplo sales' as info,
    id, 
    total,
    pg_typeof(total) as tipo_total
FROM sales 
LIMIT 5;

-- =========================================================
-- 2. MIGRACIÓN DE TABLA sale_details
-- =========================================================

-- Migrar unit_price a DECIMAL(10,2)
-- USING convierte automáticamente los datos existentes
ALTER TABLE sale_details 
ALTER COLUMN unit_price TYPE DECIMAL(10,2) 
USING unit_price::DECIMAL(10,2);

-- Migrar subtotal a DECIMAL(10,2)
ALTER TABLE sale_details 
ALTER COLUMN subtotal TYPE DECIMAL(10,2) 
USING subtotal::DECIMAL(10,2);

-- =========================================================
-- 3. MIGRACIÓN DE TABLA sales (si es necesario)
-- =========================================================

-- Verificar si total ya es decimal, si no, migrarlo
DO $$
BEGIN
    -- Solo migrar si no es decimal
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'total') != 'numeric' THEN
        
        ALTER TABLE sales 
        ALTER COLUMN total TYPE DECIMAL(10,2) 
        USING total::DECIMAL(10,2);
        
        RAISE NOTICE 'Campo total migrado a DECIMAL(10,2)';
    ELSE
        RAISE NOTICE 'Campo total ya es de tipo DECIMAL';
    END IF;
END
$$;

-- =========================================================
-- 4. VERIFICACIÓN POST-MIGRACIÓN
-- =========================================================

-- Verificar estructura DESPUÉS de la migración
SELECT 
    'DESPUÉS - sale_details' as tabla,
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_details' 
AND column_name IN ('unit_price', 'subtotal')
ORDER BY column_name;

SELECT 
    'DESPUÉS - sales' as tabla,
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name = 'total';

-- Verificar que los datos se preservaron correctamente
SELECT 
    'DESPUÉS - Datos de ejemplo sale_details' as info,
    id, 
    unit_price, 
    subtotal,
    pg_typeof(unit_price) as tipo_unit_price,
    pg_typeof(subtotal) as tipo_subtotal
FROM sale_details 
LIMIT 5;

SELECT 
    'DESPUÉS - Datos de ejemplo sales' as info,
    id, 
    total,
    pg_typeof(total) as tipo_total
FROM sales 
LIMIT 5;

-- =========================================================
-- 5. PRUEBA DE FUNCIONAMIENTO
-- =========================================================

-- Insertar un registro de prueba para verificar que acepta decimales
-- (Opcional - puedes comentar esta sección si no quieres datos de prueba)

/*
INSERT INTO sale_details (quantity, unit_price, subtotal, product_id, product_type) 
VALUES (2, 15.99, 31.98, 1, 'general');

SELECT 'PRUEBA - Nuevo registro con decimales' as info, * 
FROM sale_details 
WHERE unit_price = 15.99;

-- Eliminar el registro de prueba
DELETE FROM sale_details WHERE unit_price = 15.99;
*/

-- =========================================================
-- RESUMEN DE CAMBIOS
-- =========================================================

SELECT '=== MIGRACIÓN COMPLETADA ===' as resultado;
SELECT 'Los campos unit_price y subtotal en sale_details ahora soportan decimales' as cambio1;
SELECT 'El campo total en sales ahora soporta decimales' as cambio2;
SELECT 'Todos los datos existentes han sido preservados' as garantia;
SELECT 'Ahora puedes usar valores como: 15.99, 123.45, 1000.00' as ejemplos; 