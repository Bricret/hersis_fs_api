# Guía Paso a Paso: Migración de Campos Decimales en pgAdmin

## ⚠️ IMPORTANTE: REALIZAR RESPALDO ANTES DE CONTINUAR

### Paso 1: Crear Respaldo de la Base de Datos

1. **Abrir pgAdmin**
2. **Conectar a tu servidor PostgreSQL**
3. **Hacer clic derecho en tu base de datos** (hersis_fs)
4. **Seleccionar "Backup..."**
5. **Configurar el respaldo:**
   - Nombre: `hersis_fs_backup_antes_migracion_YYYYMMDD`
   - Formato: Custom
   - Ubicación: Escritorio o carpeta segura
6. **Hacer clic en "Backup"**
7. **Esperar a que termine y verificar que el archivo se creó**

---

## Paso 2: Abrir el Editor de Consultas

1. **En pgAdmin, hacer clic derecho en tu base de datos** (hersis_fs)
2. **Seleccionar "Query Tool"** (Herramienta de consulta)
3. **Se abrirá una ventana nueva con un editor SQL**

---

## Paso 3: Ejecutar el Script de Migración

### 3.1 Copiar el Script Completo

Copiar todo el contenido del archivo `migracion-completa-pgadmin.sql` y pegarlo en el editor de consultas de pgAdmin.

### 3.2 Ejecutar el Script

1. **Hacer clic en el botón "Execute/Refresh" (▶️)** o presionar **F5**
2. **El script se ejecutará automáticamente**
3. **Revisar los resultados en la pestaña "Data Output"**

---

## Paso 4: Interpretar los Resultados

### 4.1 Verificaciones Iniciales
El script mostrará:
- **Estado actual** de las columnas (ANTES)
- **Datos de ejemplo** existentes
- **Tipos de datos** actuales

### 4.2 Proceso de Migración
El script ejecutará:
- **Migración de unit_price** → DECIMAL(10,2)
- **Migración de subtotal** → DECIMAL(10,2)
- **Verificación de total** en tabla sales

### 4.3 Verificaciones Finales
El script mostrará:
- **Estado nuevo** de las columnas (DESPUÉS)
- **Datos preservados** correctamente
- **Confirmación** de que todo funcionó

---

## Paso 5: Verificación Manual Adicional

### 5.1 Verificar Estructura de Tablas

Ejecutar estas consultas por separado para confirmar:

```sql
-- Verificar sale_details
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'sale_details' 
AND column_name IN ('unit_price', 'subtotal');
```

**Resultado esperado:**
- unit_price: data_type = 'numeric', precision = 10, scale = 2
- subtotal: data_type = 'numeric', precision = 10, scale = 2

### 5.2 Verificar Datos Existentes

```sql
-- Ver algunos registros para confirmar que los datos están intactos
SELECT id, unit_price, subtotal FROM sale_details LIMIT 10;
```

### 5.3 Probar Inserción de Decimales

```sql
-- Probar que ahora acepta decimales (OPCIONAL)
-- Solo ejecutar si quieres hacer una prueba
INSERT INTO sale_details (quantity, unit_price, subtotal, product_id, product_type) 
VALUES (1, 15.99, 15.99, 1, 'general');

-- Verificar que se insertó correctamente
SELECT * FROM sale_details WHERE unit_price = 15.99;

-- Eliminar el registro de prueba
DELETE FROM sale_details WHERE unit_price = 15.99;
```

---

## Paso 6: Verificar que la Aplicación Funciona

1. **Iniciar tu aplicación NestJS**
2. **Probar funcionalidades** relacionadas con ventas
3. **Verificar que puede** guardar y leer decimales correctamente
4. **Ejemplo:** Crear una venta con precio 15.99

---

## ❌ En Caso de Problemas

### Si algo sale mal:

1. **Detener la aplicación**
2. **En pgAdmin, hacer clic derecho en la base de datos**
3. **Seleccionar "Restore..."**
4. **Seleccionar el archivo de respaldo** que creaste en el Paso 1
5. **Restaurar la base de datos**
6. **Contactar al desarrollador** para revisar el problema

---

## ✅ Resultado Final

Después de esta migración podrás:

- **Guardar precios con decimales:** 15.99, 123.45, 1000.00
- **Mantener todos los datos existentes** intactos
- **Usar la aplicación normalmente** con soporte para decimales

---

## 📝 Notas Importantes

1. **Esta migración es segura** - no borra datos
2. **Los valores existentes se convierten automáticamente**
3. **Si un valor era 15, ahora será 15.00**
4. **Si no hay datos aún, no habrá problemas**
5. **El campo total en sales también quedará listo para decimales**

---

## 🔧 Para el Desarrollador

Si necesitas revertir los cambios:

```sql
-- Para revertir a enteros (SOLO SI ES NECESARIO)
ALTER TABLE sale_details ALTER COLUMN unit_price TYPE INTEGER USING unit_price::INTEGER;
ALTER TABLE sale_details ALTER COLUMN subtotal TYPE INTEGER USING subtotal::INTEGER;
```

**⚠️ ADVERTENCIA:** Revertir eliminará los decimales de los datos existentes. 