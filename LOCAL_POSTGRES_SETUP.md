# Configuración de PostgreSQL Local para Hersis FS API

Esta guía te ayudará a configurar y usar PostgreSQL instalado localmente en lugar de Docker.

## Prerrequisitos

1. **Instalar PostgreSQL** en tu sistema:
   - **macOS**: `brew install postgresql@14`
   - **Linux (Ubuntu/Debian)**: `sudo apt-get install postgresql-14`
   - **Windows**: Descargar desde [postgresql.org](https://www.postgresql.org/download/)

## Paso 1: Iniciar PostgreSQL Local

### macOS (con Homebrew)
```bash
# Iniciar el servicio
brew services start postgresql@14

# O iniciarlo manualmente sin servicio
pg_ctl -D /opt/homebrew/var/postgresql@14 start
```

### Linux
```bash
# Iniciar el servicio
sudo systemctl start postgresql

# Habilitar para inicio automático
sudo systemctl enable postgresql
```

### Windows
El servicio debería iniciarse automáticamente después de la instalación. Si no:
- Abre "Servicios" y busca "postgresql-x64-14"
- Inícialo manualmente

## Paso 2: Verificar que PostgreSQL está corriendo

```bash
# Debería mostrar que está listo para aceptar conexiones
pg_isready

# Debería retornar algo como:
# /tmp:5432 - accepting connections
```

## Paso 3: Crear el usuario y la base de datos

### Acceder a PostgreSQL como superusuario
```bash
# En macOS/Linux
psql postgres

# En Windows (desde psql en CMD o PowerShell)
psql -U postgres
```

### Crear el usuario (si no existe)
```sql
-- Verificar si el usuario 'postgres' existe (debería existir por defecto)
\du

-- Si necesitas crear un nuevo usuario específico:
CREATE USER postgres WITH PASSWORD 'HersisFS20241106';
ALTER USER postgres WITH SUPERUSER;

-- O simplemente cambiar la contraseña del usuario postgres existente:
ALTER USER postgres WITH PASSWORD 'HersisFS20241106';
```

### Crear la base de datos
```sql
-- Crear la base de datos
CREATE DATABASE hersis_fs_db;

-- Otorgar privilegios al usuario
GRANT ALL PRIVILEGES ON DATABASE hersis_fs_db TO postgres;

-- Salir de psql
\q
```

## Paso 4: Ejecutar el script de migración (si es necesario)

Si necesitas ejecutar el script de migración de columnas decimal:

```bash
psql -U postgres -d hersis_fs_db -f migrate-decimal-columns.sql
```

## Paso 5: Configurar las variables de entorno

### Opción A: Usar el archivo .env.local (Recomendado)

Copia el archivo `.env.local` a `.env`:

```bash
cp .env.local .env
```

### Opción B: Modificar el .env manualmente

Asegúrate de que tu archivo `.env` tenga estas variables:

```env
# DB Config environment variables
DB_PASSWORD=HersisFS20241106
DB_NAME=hersis_fs_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres

# global environment variables
PORT=3000
JWT_SECRET=1234567890
```

**Nota importante sobre las variables:**

- **DB_HOST**: Debe ser `localhost` o `127.0.0.1` para PostgreSQL local
- **DB_PORT**: Por defecto PostgreSQL usa el puerto `5432`
- **DB_USERNAME**: Por defecto es `postgres` (puedes cambiarlo si creaste otro usuario)
- **DB_PASSWORD**: La contraseña que configuraste para el usuario
- **DB_NAME**: El nombre de la base de datos que creaste

## Paso 6: Verificar la conexión

Puedes verificar que puedes conectarte a la base de datos:

```bash
psql -U postgres -h localhost -d hersis_fs_db
```

Debería pedirte la contraseña y luego conectarte. Escribe `\q` para salir.

## Paso 7: Iniciar la aplicación

```bash
# Instalar dependencias si no lo has hecho
pnpm install

# Iniciar en modo desarrollo
pnpm run start:dev
```

## Diferencias entre PostgreSQL Local y Docker

### PostgreSQL Local
- **Ventajas**:
  - Más rápido de iniciar
  - No requiere Docker
  - Usa menos recursos
  - Mejor para desarrollo rápido
  
- **Desventajas**:
  - Tienes que gestionar PostgreSQL manualmente
  - Puede tener conflictos con otras instalaciones de PostgreSQL

### PostgreSQL Docker
- **Ventajas**:
  - Entorno aislado
  - Fácil de limpiar y reiniciar
  - Mismo entorno en cualquier máquina
  - Incluye volúmenes para persistencia

- **Desventajas**:
  - Requiere Docker instalado
  - Un poco más lento de iniciar

## Comandos útiles de PostgreSQL

### Ver todas las bases de datos
```bash
psql -U postgres -l
```

### Conectarse a la base de datos
```bash
psql -U postgres -d hersis_fs_db
```

### Comandos dentro de psql
```sql
-- Listar todas las tablas
\dt

-- Ver la estructura de una tabla
\d nombre_tabla

-- Listar todos los usuarios
\du

-- Ver la base de datos actual
SELECT current_database();

-- Ver todas las conexiones activas
SELECT * FROM pg_stat_activity WHERE datname = 'hersis_fs_db';
```

### Eliminar y recrear la base de datos (si necesitas empezar de cero)
```bash
# Desde la terminal
psql -U postgres

# Dentro de psql
DROP DATABASE hersis_fs_db;
CREATE DATABASE hersis_fs_db;
GRANT ALL PRIVILEGES ON DATABASE hersis_fs_db TO postgres;
\q
```

## Cambiar entre PostgreSQL Local y Docker

### Para volver a usar Docker:
1. Copia `.env.docker` a `.env` (o simplemente asegúrate de que las variables sean correctas)
2. Detén PostgreSQL local:
   - macOS: `brew services stop postgresql@14`
   - Linux: `sudo systemctl stop postgresql`
3. Inicia Docker: `docker-compose up -d`

### Para usar PostgreSQL Local:
1. Detén Docker: `docker-compose down`
2. Copia `.env.local` a `.env`
3. Inicia PostgreSQL local (ver Paso 1)

## Solución de problemas comunes

### Error: "role 'postgres' does not exist"
```bash
# Crear el rol postgres
createuser -s postgres
```

### Error: "could not connect to server"
- Verifica que PostgreSQL está corriendo: `pg_isready`
- Verifica el puerto: `lsof -i :5432` (en macOS/Linux)
- Intenta reiniciar: `brew services restart postgresql@14` (macOS)

### Error: "password authentication failed"
- Verifica que la contraseña en `.env` coincide con la de PostgreSQL
- Puedes cambiar la contraseña: `ALTER USER postgres WITH PASSWORD 'nueva_contraseña';`

### Error: "port 5432 already in use"
- Probablemente Docker todavía está corriendo: `docker-compose down`
- O hay otra instancia de PostgreSQL: `lsof -i :5432` para ver qué está usando el puerto

## Backup y Restore

### Crear un backup
```bash
pg_dump -U postgres hersis_fs_db > backup.sql
```

### Restaurar desde un backup
```bash
psql -U postgres -d hersis_fs_db < backup.sql
```

---

**Nota**: Esta configuración mantiene intacta la configuración de Docker. Puedes cambiar entre ambas opciones según tus necesidades.

//user
7dcae87d-c05c-441f-8cc8-e845b4f5e4ad	Bricret	Briqueta	brian.rico375@gmail.com	$2b$10$d1V3D20CA1rjomachgZxduW86mYs0YsdnpXxx/kBRyeMaxop1v0ZC	admin	true	2025-08-20 14:20:43.056	dcdfcc7a-b5fa-444f-b6c1-bcff84365f64

//Branch
dcdfcc7a-b5fa-444f-b6c1-bcff84365f64	Farmacia los Ángeles	nose	65451263

//presentation
1	Tableta
2	Capsula
3	Jarabe
4	Suspension
5	Crema
6	Unguento
7	Inyectable
8	Gotas
9	Parche
10	Otro
11	Polvo

//categories
2	Analgesicos	nose
3	Antibioticos	nose
4	Alergias	nose
5	Vitaminas	nose
8	Prueba 2	Esto es una prueba