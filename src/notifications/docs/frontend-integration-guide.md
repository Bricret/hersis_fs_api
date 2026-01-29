# 🚀 Guía de Integración Frontend - Sistema de Notificaciones

## 📋 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Tipos TypeScript](#tipos-typescript)
3. [Esquemas de Respuesta](#esquemas-de-respuesta)
4. [Constantes y Configuraciones](#constantes-y-configuraciones)
5. [Componentes React](#componentes-react)
6. [Hooks Personalizados](#hooks-personalizados)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

## 🛠️ Instalación y Configuración

### 1. Instalar Dependencias

```bash
# Si usas npm
npm install @nestjs/swagger class-validator class-transformer

# Si usas yarn
yarn add @nestjs/swagger class-validator class-transformer

# Si usas pnpm
pnpm add @nestjs/swagger class-validator class-transformer
```

### 2. Configurar Swagger/OpenAPI

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Hersis FS API')
    .setDescription('API del sistema de farmacia Hersis FS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

### 3. Importar Tipos en el Frontend

```typescript
// En tu proyecto frontend
import {
  BaseNotification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationFilters,
  // ... otros tipos
} from 'hersis-fs-api/notifications';
```

## 📝 Tipos TypeScript

### Tipos Base

```typescript
// Notificación base
interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata: NotificationMetadata;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  branch_id?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Metadatos específicos por tipo
interface NotificationMetadata {
  // Stock bajo
  current_stock?: number;
  min_stock?: number;
  product_name?: string;
  
  // Vencimiento
  expiration_date?: string;
  days_until_expiration?: number;
  lot_number?: string;
  
  // Ventas
  sale_amount?: number;
  customer_name?: string;
  
  // Genérico
  [key: string]: any;
}
```

### Tipos Específicos

```typescript
// Notificación de stock bajo
interface LowStockNotification extends BaseNotification {
  type: NotificationType.LOW_STOCK;
  metadata: {
    current_stock: number;
    min_stock: number;
    product_name: string;
    category?: string;
  };
  entity_type: 'product';
}

// Notificación de vencimiento
interface ExpirationWarningNotification extends BaseNotification {
  type: NotificationType.EXPIRATION_WARNING;
  metadata: {
    expiration_date: string;
    days_until_expiration: number;
    product_name: string;
    lot_number?: string;
  };
  entity_type: 'product';
}
```

### Enums

```typescript
enum NotificationType {
  LOW_STOCK = 'low_stock',
  EXPIRATION_WARNING = 'expiration_warning',
  SALE_REMINDER = 'sale_reminder',
  SYSTEM_ALERT = 'system_alert',
  INVENTORY_ALERT = 'inventory_alert',
}

enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed',
  ARCHIVED = 'archived',
}
```

## 🎯 Esquemas de Respuesta

### Respuesta de Notificación Individual

```typescript
interface NotificationResponseSchema {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata: Record<string, any>;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  branch_id?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Respuesta Paginada

```typescript
interface PaginatedNotificationsResponseSchema {
  notifications: NotificationResponseSchema[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

### Conteo de No Leídas

```typescript
interface UnreadCountResponseSchema {
  unread_count: number;
  by_priority?: Record<NotificationPriority, number>;
  by_type?: Record<NotificationType, number>;
}
```

## ⚙️ Constantes y Configuraciones

### Configuración de Tipos

```typescript
const NOTIFICATION_TYPE_CONFIG = {
  [NotificationType.LOW_STOCK]: {
    label: 'Stock Bajo',
    icon: '📦',
    color: '#ef4444',
    description: 'Productos con inventario insuficiente',
    actions: ['Ver producto', 'Reponer stock', 'Ignorar'],
  },
  // ... otros tipos
};
```

### Configuración de Prioridades

```typescript
const PRIORITY_CONFIG = {
  [NotificationPriority.CRITICAL]: {
    label: 'Crítica',
    color: '#ef4444',
    icon: '🔴',
    severity: 4,
  },
  // ... otras prioridades
};
```

### Configuración de UI

```typescript
const UI_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_REFRESH_INTERVAL: 30000, // 30 segundos
  NOTIFICATION_ANIMATION_DURATION: 300,
  // ... otras configuraciones
};
```

## 🧩 Componentes React

### Provider Principal

```typescript
import { NotificationProvider } from 'hersis-fs-api/notifications';

function App() {
  return (
    <NotificationProvider userId="user-123" branchId="branch-001">
      <YourApp />
    </NotificationProvider>
  );
}
```

### Hook de Notificaciones

```typescript
import { useNotifications } from 'hersis-fs-api/notifications';

function NotificationComponent() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismiss,
    // ... otras funciones
  } = useNotifications();

  // Tu lógica aquí
}
```

### Componente de Badge

```typescript
import { NotificationBadge } from 'hersis-fs-api/notifications';

function Header() {
  return (
    <header>
      <h1>Hersis FS</h1>
      <NotificationBadge
        count={unreadCount}
        variant="critical"
        size="lg"
        onClick={() => navigate('/notifications')}
      />
    </header>
  );
}
```

### Componente de Lista

```typescript
import { NotificationList } from 'hersis-fs-api/notifications';

function NotificationsPage() {
  return (
    <div>
      <h1>Notificaciones</h1>
      <NotificationList
        notifications={notifications}
        loading={loading}
        error={error}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  );
}
```

## 🎣 Hooks Personalizados

### Hook de Filtros

```typescript
import { useState, useCallback } from 'react';
import { NotificationFilters } from 'hersis-fs-api/notifications';

export function useNotificationFilters() {
  const [filters, setFilters] = useState<NotificationFilters>({
    limit: 20,
    offset: 0,
  });

  const updateFilters = useCallback((newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0, // Resetear offset al cambiar filtros
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      limit: 20,
      offset: 0,
    });
  }, []);

  return { filters, updateFilters, resetFilters };
}
```

### Hook de Paginación

```typescript
import { useState, useCallback } from 'react';
import { PaginationInfo } from 'hersis-fs-api/notifications';

export function useNotificationPagination() {
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    totalPages: 0,
    currentPage: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const goToPage = useCallback((page: number) => {
    const offset = (page - 1) * pagination.limit;
    setPagination(prev => ({
      ...prev,
      currentPage: page,
      offset,
    }));
  }, [pagination.limit]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [pagination.hasNextPage, pagination.currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [pagination.hasPreviousPage, pagination.currentPage, goToPage]);

  return {
    pagination,
    setPagination,
    goToPage,
    nextPage,
    previousPage,
  };
}
```

## 💡 Ejemplos de Uso

### 1. Dashboard con Contador de Notificaciones

```typescript
import React from 'react';
import { useNotifications } from 'hersis-fs-api/notifications';
import { NotificationBadge } from 'hersis-fs-api/notifications';

function Dashboard() {
  const { unreadCount } = useNotifications();

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Dashboard</h1>
        <div className="notifications">
          <NotificationBadge
            count={unreadCount}
            variant={unreadCount > 10 ? 'critical' : 'default'}
            size="lg"
          />
        </div>
      </div>
      
      {/* Resto del dashboard */}
    </div>
  );
}
```

### 2. Lista de Notificaciones con Filtros

```typescript
import React, { useState } from 'react';
import { useNotifications } from 'hersis-fs-api/notifications';
import { NotificationList, NotificationFilters } from 'hersis-fs-api/notifications';
import { NotificationFilters as FiltersType } from 'hersis-fs-api/notifications';

function NotificationsPage() {
  const { notifications, loading, error, updateFilters } = useNotifications();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersType>({});

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  return (
    <div className="notifications-page">
      <div className="header">
        <h1>Notificaciones</h1>
        <button onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && (
        <NotificationFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showAdvanced={true}
        />
      )}

      <NotificationList
        notifications={notifications}
        loading={loading}
        error={error}
      />
    </div>
  );
}
```

### 3. Notificación en Tiempo Real

```typescript
import React, { useEffect } from 'react';
import { useNotifications } from 'hersis-fs-api/notifications';
import { NotificationType, NotificationPriority } from 'hersis-fs-api/notifications';

function RealTimeNotifications() {
  const { notifications, refresh } = useNotifications();

  useEffect(() => {
    // Configurar WebSocket para notificaciones en tiempo real
    const ws = new WebSocket('ws://localhost:3000/notifications');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification_created') {
        // Mostrar notificación toast
        showToast(data.notification);
        
        // Actualizar lista
        refresh();
      }
    };

    return () => ws.close();
  }, [refresh]);

  const showToast = (notification: any) => {
    // Implementar toast notification
    console.log('Nueva notificación:', notification);
  };

  return (
    <div>
      {/* Tu componente aquí */}
    </div>
  );
}
```

### 4. Integración con Productos

```typescript
import React from 'react';
import { useNotifications } from 'hersis-fs-api/notifications';
import { NotificationType } from 'hersis-fs-api/notifications';

function ProductCard({ product }: { product: any }) {
  const { notifications } = useNotifications();
  
  // Buscar notificaciones relacionadas con este producto
  const productNotifications = notifications.filter(
    n => n.entity_type === 'product' && n.entity_id === product.id
  );

  const hasLowStock = productNotifications.some(
    n => n.type === NotificationType.LOW_STOCK
  );

  const hasExpirationWarning = productNotifications.some(
    n => n.type === NotificationType.EXPIRATION_WARNING
  );

  return (
    <div className={`product-card ${hasLowStock ? 'low-stock' : ''}`}>
      <h3>{product.name}</h3>
      <p>Stock: {product.stock}</p>
      
      {hasLowStock && (
        <div className="alert low-stock">
          ⚠️ Stock bajo
        </div>
      )}
      
      {hasExpirationWarning && (
        <div className="alert expiration">
          ⏰ Próximo a vencer
        </div>
      )}
    </div>
  );
}
```

## ✅ Mejores Prácticas

### 1. Gestión de Estado

```typescript
// ✅ Correcto: Usar el contexto de notificaciones
function Component() {
  const { notifications, markAsRead } = useNotifications();
  // ...
}

// ❌ Incorrecto: Estado local duplicado
function Component() {
  const [notifications, setNotifications] = useState([]);
  // ...
}
```

### 2. Manejo de Errores

```typescript
// ✅ Correcto: Manejar errores apropiadamente
function Component() {
  const { error, loading } = useNotifications();

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return <YourContent />;
}
```

### 3. Optimización de Rendimiento

```typescript
// ✅ Correcto: Usar useCallback para funciones
const handleMarkAsRead = useCallback(async (id: string) => {
  await markAsRead(id);
}, [markAsRead]);

// ✅ Correcto: Usar useMemo para cálculos costosos
const criticalNotifications = useMemo(() => {
  return notifications.filter(n => n.priority === NotificationPriority.CRITICAL);
}, [notifications]);
```

### 4. Accesibilidad

```typescript
// ✅ Correcto: Incluir atributos ARIA
<button
  onClick={handleMarkAsRead}
  aria-label="Marcar notificación como leída"
  role="button"
>
  👁️
</button>
```

## 🔧 Troubleshooting

### Problema: Notificaciones no se cargan

**Síntomas:**
- Lista vacía
- Error de red
- Loading infinito

**Soluciones:**
1. Verificar que el token de autenticación esté presente
2. Verificar que la URL de la API sea correcta
3. Verificar que el usuario tenga permisos
4. Revisar la consola del navegador para errores

```typescript
// Verificar token
const token = localStorage.getItem('token');
if (!token) {
  console.error('Token no encontrado');
  return;
}

// Verificar permisos
const user = JSON.parse(localStorage.getItem('user'));
if (!user.roles.includes('admin') && !user.roles.includes('manager')) {
  console.error('Usuario sin permisos');
  return;
}
```

### Problema: Filtros no funcionan

**Síntomas:**
- Filtros se aplican pero no hay resultados
- Filtros se resetean inesperadamente

**Soluciones:**
1. Verificar que los valores de filtros sean válidos
2. Verificar que el backend soporte los filtros
3. Verificar que el offset se resetee al cambiar filtros

```typescript
// Resetear offset al cambiar filtros
const handleFilterChange = (newFilters: NotificationFilters) => {
  setFilters(prev => ({
    ...prev,
    ...newFilters,
    offset: 0, // Importante: resetear offset
  }));
};
```

### Problema: Notificaciones duplicadas

**Síntomas:**
- Misma notificación aparece múltiples veces
- Conteo incorrecto de no leídas

**Soluciones:**
1. Verificar que el backend no esté creando duplicados
2. Verificar que el frontend no esté duplicando el estado
3. Implementar deduplicación por ID

```typescript
// Deduplicación por ID
const uniqueNotifications = useMemo(() => {
  const seen = new Set();
  return notifications.filter(notification => {
    if (seen.has(notification.id)) {
      return false;
    }
    seen.add(notification.id);
    return true;
  });
}, [notifications]);
```

### Problema: Rendimiento lento

**Síntomas:**
- Lista tarda en cargar
- Interacciones lentas
- Consumo alto de memoria

**Soluciones:**
1. Implementar virtualización para listas largas
2. Usar paginación infinita
3. Implementar debounce en filtros
4. Optimizar re-renders

```typescript
// Debounce en filtros
import { debounce } from 'lodash';

const debouncedUpdateFilters = useMemo(
  () => debounce(updateFilters, 300),
  [updateFilters]
);

// Virtualización
import { FixedSizeList as List } from 'react-window';

function VirtualizedNotificationList({ notifications }: { notifications: BaseNotification[] }) {
  return (
    <List
      height={600}
      itemCount={notifications.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <NotificationItem notification={notifications[index]} />
        </div>
      )}
    </List>
  );
}
```

## 📚 Recursos Adicionales

### Documentación de la API
- [Swagger UI](/api) - Documentación interactiva de la API
- [README del módulo](../README.md) - Documentación del módulo
- [Ejemplos de uso](../examples/usage-examples.ts) - Ejemplos prácticos

### Herramientas de Desarrollo
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) - Para debugging de React
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) - Si usas Redux
- [TypeScript Playground](https://www.typescriptlang.org/play/) - Para probar tipos

### Comunidad y Soporte
- [Issues de GitHub](https://github.com/your-repo/issues) - Reportar bugs
- [Discussions](https://github.com/your-repo/discussions) - Preguntas y respuestas
- [Wiki](https://github.com/your-repo/wiki) - Documentación adicional

---

**¿Necesitas ayuda?** 🆘
- Revisa esta guía primero
- Busca en los issues existentes
- Crea un nuevo issue con detalles del problema
- Contacta al equipo de desarrollo

**¡Feliz desarrollo!** 🚀









