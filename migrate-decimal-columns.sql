-- Migración de columnas decimales para Hersis FS
-- Este archivo se ejecuta automáticamente durante la inicialización de la base de datos

-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS hersis_fs;

-- Comentario: Aquí puedes agregar las migraciones específicas para columnas decimales
-- Por ejemplo:
-- ALTER TABLE tabla_ejemplo ALTER COLUMN precio TYPE DECIMAL(10,2);

-- Ejemplo de migración placeholder
SELECT 'Migración de columnas decimales completada' AS status;
