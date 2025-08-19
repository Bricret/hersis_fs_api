# 🔔 Notificaciones Push en Tiempo Real

Este documento explica cómo implementar y usar el sistema de notificaciones push en tiempo real en tu aplicación Hersis FS.

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Arquitectura](#arquitectura)
3. [Instalación](#instalación)
4. [Configuración del Backend](#configuración-del-backend)
5. [Configuración del Frontend](#configuración-del-frontend)
6. [Uso](#uso)
7. [Pruebas](#pruebas)
8. [Solución de Problemas](#solución-de-problemas)
9. [Personalización](#personalización)

## ✨ Características

- ✅ **Notificaciones en tiempo real** usando WebSockets
- ✅ **Notificaciones push del navegador** nativas
- ✅ **Reconexión automática** en caso de desconexión
- ✅ **Autenticación JWT** para WebSockets
- ✅ **Salas por usuario** para notificaciones privadas
- ✅ **Sistema de prioridades** (bajo, medio, alto, crítico)
- ✅ **Integración con cron jobs** existentes
- ✅ **Interfaz React** lista para usar
- ✅ **Sonidos de notificación** opcionales

## 🏗️ Arquitectura

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (React)       │                 │   (NestJS)      │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Browser       │                 │   Cron Jobs     │
│   Notifications │                 │   (Product      │
│                 │                 │    Monitoring)  │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Instalación

### Backend

Las dependencias ya están instaladas:
- `@nestjs/websockets@^10.0.0`
- `@nestjs/platform-socket.io@^10.0.0`
- `socket.io@^4.7.0`

### Frontend

```bash
npm install socket.io-client
# o
yarn add socket.io-client
# o
pnpm add socket.io-client
```

## ⚙️ Configuración del Backend

### 1. Gateway de Notificaciones

El `NotificationsGateway` ya está configurado en:
- `src/notifications/notifications.gateway.ts`
- `src/auth/guards/ws-jwt.guard.ts`

### 2. Servicio de Notificaciones

El servicio ya está integrado con el gateway en:
- `src/notifications/notifications.service.ts`

### 3. Módulo de Notificaciones

El módulo ya incluye el gateway en:
- `src/notifications/notifications.module.ts`

### 4. Endpoint de Prueba

Se agregó un endpoint para probar notificaciones:
```
POST /notifications/test-push/:userId
```

## 🎨 Configuración del Frontend

### 1. Servicio de Notificaciones

El servicio está en:
- `src/notifications/frontend-integration/notification-service.ts`

### 2. Componente React

El componente está en:
- `src/notifications/frontend-integration/NotificationComponent.tsx`

### 3. Uso Básico

```tsx
import { NotificationComponent } from './NotificationComponent';

function App() {
  const userId = "123"; // ID del usuario autenticado
  const token = "jwt-token"; // Token JWT del usuario

  return (
    <div>
      <NotificationComponent userId={userId} token={token} />
    </div>
  );
}
```

### 4. Uso Avanzado

```tsx
import { NotificationService } from './notification-service';

class MyComponent {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService(userId, token);
    this.setupNotifications();
  }

  async setupNotifications() {
    // Solicitar permisos
    await this.notificationService.requestNotificationPermission();
    
    // Conectar al servidor
    await this.notificationService.connect();
    
    // Escuchar nuevas notificaciones
    window.addEventListener('newNotification', (event) => {
      const notification = event.detail;
      console.log('Nueva notificación:', notification);
      // Actualizar UI, mostrar toast, etc.
    });
  }

  cleanup() {
    this.notificationService.disconnect();
  }
}
```

## 📱 Uso

### 1. Iniciar el Backend

```bash
pnpm run start:dev
```

### 2. Conectar desde el Frontend

```tsx
// El componente se conecta automáticamente
<NotificationComponent userId="123" token="jwt-token" />
```

### 3. Recibir Notificaciones

Las notificaciones llegan automáticamente cuando:
- Se crean desde el cron job
- Se crean manualmente desde la API
- Se envían desde otros servicios

### 4. Notificaciones del Navegador

El sistema solicita permisos y muestra notificaciones nativas del navegador.

## 🧪 Pruebas

### 1. Probar Conexión WebSocket

1. Abre la consola del navegador
2. Verifica que aparezca "✅ Conectado al servidor de notificaciones"
3. El indicador de estado debe mostrar "🟢 Conectado"

### 2. Probar Notificación Push

1. Haz clic en "🧪 Enviar Notificación de Prueba"
2. Deberías recibir una notificación inmediatamente
3. Verifica que aparezca en la lista de notificaciones

### 3. Probar Notificaciones del Navegador

1. Haz clic en "🔔 Solicitar Permisos de Notificación"
2. Acepta los permisos en el navegador
3. Envía una notificación de prueba
4. Debería aparecer una notificación del sistema

### 4. Probar Reconexión

1. Detén el servidor backend
2. Verifica que el estado cambie a "🔴 Desconectado"
3. Reinicia el servidor
4. Verifica que se reconecte automáticamente

## 🔧 Solución de Problemas

### Error: "Cannot connect to WebSocket server"

**Causa:** El servidor no está ejecutándose o hay problemas de CORS.

**Solución:**
1. Verifica que el backend esté ejecutándose
2. Verifica la URL en el frontend (`http://localhost:3000`)
3. Verifica la configuración CORS en el gateway

### Error: "Token no proporcionado"

**Causa:** No se está enviando el token JWT en la conexión.

**Solución:**
1. Verifica que el token sea válido
2. Verifica que se esté enviando en `auth.token`
3. Verifica que el usuario esté autenticado

### Error: "Permisos de notificación denegados"

**Causa:** El usuario denegó los permisos de notificación.

**Solución:**
1. Haz clic en "🔔 Solicitar Permisos de Notificación"
2. Acepta los permisos en el navegador
3. Si ya fueron denegados, reinicia el navegador

### Las notificaciones no aparecen en tiempo real

**Causa:** Problemas con WebSockets o eventos.

**Solución:**
1. Verifica la consola del navegador
2. Verifica que el WebSocket esté conectado
3. Verifica que los eventos se estén emitiendo

## 🎨 Personalización

### 1. Cambiar Estilos

Modifica los estilos CSS en el componente `NotificationComponent.tsx`.

### 2. Cambiar Sonidos

Cambia la ruta del archivo de sonido en `notification-service.ts`:
```typescript
const audio = new Audio('/tu-sonido.mp3');
```

### 3. Cambiar Iconos

Cambia las rutas de los iconos en `notification-service.ts`:
```typescript
new Notification(notification.title, {
  icon: '/tu-icono.png',
  badge: '/tu-badge.png',
});
```

### 4. Agregar Más Tipos de Notificaciones

1. Agrega nuevos tipos en `notification.entity.ts`
2. Actualiza la lógica en `notifications.service.ts`
3. Personaliza el manejo en el frontend

### 5. Cambiar Configuración de Reconexión

Modifica en `notification-service.ts`:
```typescript
private maxReconnectAttempts: number = 10; // Más intentos
private reconnectDelay: number = 2000; // Más delay
```

## 📚 API Reference

### NotificationsGateway

- `sendNotificationToUser(userId: string, notification: any)`
- `sendNotificationToAll(notification: any)`
- `sendNotificationToUsers(userIds: string[], notification: any)`
- `getConnectedUsers(): string[]`
- `isUserConnected(userId: string): boolean`

### NotificationService (Frontend)

- `connect(): Promise<void>`
- `disconnect(): void`
- `getConnectionStatus(): boolean`
- `requestNotificationPermission(): Promise<boolean>`
- `sendMessage(event: string, data: any): void`

## 🚀 Próximos Pasos

1. **Integrar con tu UI existente** - Reemplaza el componente de ejemplo
2. **Agregar más tipos de notificaciones** - Stock bajo, vencimientos, etc.
3. **Implementar persistencia** - Guardar notificaciones en localStorage
4. **Agregar filtros** - Por tipo, prioridad, fecha, etc.
5. **Implementar notificaciones push móviles** - Service Workers, PWA

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la consola del navegador
2. Revisa los logs del backend
3. Verifica la documentación de Socket.IO
4. Consulta los ejemplos en el código

---

**¡Las notificaciones push en tiempo real están listas para usar! 🎉**
