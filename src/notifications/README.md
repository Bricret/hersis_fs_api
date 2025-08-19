# Sistema de Notificaciones - Hersis FS

## Descripción

Este módulo implementa un sistema de notificaciones generalizado para el sistema de farmacia Hersis FS. Permite crear, gestionar y monitorear diferentes tipos de notificaciones con prioridades y estados específicos.

## Características Principales

### 🔔 Tipos de Notificaciones
- **LOW_STOCK**: Productos con bajo stock
- **EXPIRATION_WARNING**: Productos próximos a vencer o vencidos
- **SALE_REMINDER**: Recordatorios de ventas (futura implementación)
- **SYSTEM_ALERT**: Alertas del sistema (futura implementación)
- **INVENTORY_ALERT**: Alertas de inventario (futura implementación)

### 📊 Prioridades
- **LOW**: Prioridad baja (verde)
- **MEDIUM**: Prioridad media (amarillo)
- **HIGH**: Prioridad alta (naranja)
- **CRITICAL**: Prioridad crítica (rojo)

### 📋 Estados
- **UNREAD**: No leída
- **READ**: Leída
- **DISMISSED**: Descartada
- **ARCHIVED**: Archivada

## Funcionalidades Implementadas

### ⚡ Monitoreo Automático de Productos

#### Productos con Bajo Stock
- **Horario**: Todos los días a las 8:00 AM
- **Umbral**: 10 unidades (configurable)
- **Prioridad**: CRITICAL si stock = 0, HIGH si stock ≤ umbral

#### Productos Próximos a Vencer
- **Horario**: Todos los días a las 9:00 AM
- **Ventana de alerta**: 30 días antes del vencimiento
- **Prioridades**:
  - CRITICAL: Producto vencido (≤ 0 días)
  - HIGH: Vence en ≤ 7 días
  - MEDIUM: Vence en ≤ 30 días
  - LOW: Vence en > 30 días

### 🛡️ Prevención de Duplicados
El sistema verifica automáticamente si ya existe una notificación similar activa antes de crear una nueva, evitando spam de notificaciones.

## API Endpoints

### 📝 CRUD Básico

```bash
# Obtener todas las notificaciones (con filtros)
GET /notifications?type=low_stock&priority=high&status=unread&limit=20

# Obtener notificación específica
GET /notifications/:id

# Crear notificación
POST /notifications
{
  "type": "low_stock",
  "title": "Stock Bajo",
  "message": "El producto X tiene stock bajo",
  "priority": "high",
  "entity_type": "product",
  "entity_id": "123"
}

# Actualizar notificación
PATCH /notifications/:id
{
  "status": "read"
}

# Eliminar notificación
DELETE /notifications/:id
```

### 🔍 Endpoints Especiales

```bash
# Conteo de notificaciones no leídas
GET /notifications/unread-count?user_id=123&branch_id=456

# Marcar como leída
PATCH /notifications/:id/read

# Descartar notificación
PATCH /notifications/:id/dismiss

# Marcar múltiples como leídas
PATCH /notifications/bulk/read
{
  "ids": ["1", "2", "3"]
}
```

### 🔧 Endpoints de Monitoreo Manual

```bash
# Verificar producto específico
POST /notifications/check-product/:id?type=medicine

# Ejecutar verificación de bajo stock
POST /notifications/check-low-stock

# Ejecutar verificación de vencimientos
POST /notifications/check-expiring
```

## Estructura de Datos

### Entidad Notification

```typescript
{
  id: bigint;                    // ID único
  type: NotificationType;        // Tipo de notificación
  title: string;                 // Título breve
  message: string;               // Mensaje detallado
  priority: NotificationPriority; // Prioridad
  status: NotificationStatus;    // Estado actual
  metadata: Record<string, any>; // Datos adicionales
  entity_type: string;           // Tipo de entidad relacionada
  entity_id: string;             // ID de la entidad
  user_id: string;               // Usuario destinatario
  branch_id: string;             // Sucursal
  expires_at: Date;              // Fecha de expiración
  is_active: boolean;            // Estado activo
  created_at: Date;              // Fecha de creación
  updated_at: Date;              // Fecha de actualización
}
```

### Metadata Examples

#### Bajo Stock
```json
{
  "current_stock": 5,
  "min_stock": 10,
  "product_name": "Acetaminofén 500mg"
}
```

#### Próximo a Vencer
```json
{
  "expiration_date": "2024-01-15T00:00:00.000Z",
  "days_until_expiration": 7,
  "product_name": "Ibuprofeno 400mg"
}
```

## Configuración

### Variables de Entorno
No se requieren variables adicionales. El sistema usa la configuración existente de la base de datos.

### Umbrales por Defecto
- **Bajo Stock**: 10 unidades
- **Alerta de Vencimiento**: 30 días

### Horarios de Verificación
- **Bajo Stock**: 08:00 AM diariamente
- **Vencimientos**: 09:00 AM diariamente
- **Limpieza de expiradas**: 00:00 AM diariamente

## Seguridad

### Autenticación
Todos los endpoints requieren autenticación JWT mediante `JwtAuthGuard`.

### Autorización
- **Lectura**: Todos los usuarios autenticados
- **Escritura**: Solo roles `admin` y `manager`
- **Monitoreo manual**: Solo roles `admin` y `manager`

## Extensibilidad

### Agregar Nuevos Tipos
1. Actualizar enum `NotificationType`
2. Crear método específico en `NotificationsService`
3. Implementar lógica de monitoreo si es necesario

### Ejemplo: Recordatorios de Ventas
```typescript
async createSaleReminderNotification(
  saleId: string,
  customerName: string,
  reminderDate: Date,
): Promise<Notification> {
  const notification: CreateNotificationDto = {
    type: NotificationType.SALE_REMINDER,
    title: 'Recordatorio de Venta',
    message: `Seguimiento pendiente para la venta del cliente ${customerName}`,
    priority: NotificationPriority.MEDIUM,
    entity_type: 'sale',
    entity_id: saleId,
    metadata: {
      customer_name: customerName,
      reminder_date: reminderDate,
    },
  };

  return this.create(notification);
}
```

## Mejores Prácticas

### 1. Usar Metadata
Almacena información contextual en el campo `metadata` para facilitar el procesamiento en el frontend.

### 2. Verificar Duplicados
Siempre usa `existsSimilarNotification()` antes de crear notificaciones automáticas.

### 3. Configurar Expiración
Establece `expires_at` para notificaciones temporales que deben eliminarse automáticamente.

### 4. Filtrar por Sucursal
Usa `branch_id` para mostrar solo notificaciones relevantes por ubicación.

### 5. Gestión de Estados
Implementa flujos de estado claros: UNREAD → READ → DISMISSED/ARCHIVED

## Troubleshooting

### Problemas Comunes

1. **Cron jobs no se ejecutan**
   - Verificar que `ScheduleModule.forRoot()` esté importado
   - Revisar logs del servidor

2. **Notificaciones duplicadas**
   - Verificar implementación de `existsSimilarNotification()`
   - Revisar criterios de comparación

3. **Problemas de permisos**
   - Verificar roles del usuario
   - Revisar configuración de guards

### Logs
El sistema incluye logs informativos para monitorear la ejecución:
```
Iniciando verificación de productos con bajo stock...
Notificación de bajo stock creada para medicina: Acetaminofén 500mg
Verificación de bajo stock completada
```

## Roadmap

### Próximas Funcionalidades
- [ ] Configuración de umbrales por sucursal
- [ ] Notificaciones push/email
- [ ] Dashboard de analytics
- [ ] Integración con sistema de usuarios
- [ ] Recordatorios de ventas
- [ ] Alertas de sistema
- [ ] Webhooks para integraciones externas
