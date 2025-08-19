# 🔔 Código del Frontend para Notificaciones Push

Este archivo contiene todo el código necesario para implementar notificaciones push en tu frontend React.

## 📁 Estructura de Archivos

Crea estos archivos en tu proyecto frontend:

```
src/
├── services/
│   └── notification-service.ts
├── components/
│   └── NotificationComponent.tsx
└── hooks/
    └── useNotificationService.ts
```

## 🚀 1. Servicio de Notificaciones

**Archivo:** `src/services/notification-service.ts`

```typescript
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  metadata?: Record<string, any>;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  branch_id?: string;
  created_at: string;
  is_active: boolean;
}

export class NotificationService {
  private socket: Socket | null = null;
  private userId: string;
  private token: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
  }

  /**
   * Conectar al servidor de notificaciones
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io('http://localhost:3000/notifications', {
          auth: {
            token: this.token,
            userId: this.userId
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventListeners();
        this.setupReconnectionLogic();
        
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Conectado al servidor de notificaciones');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Error al crear conexión:', error);
        reject(error);
      }
    });
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Unirse a la sala del usuario
    this.socket.emit('joinUserRoom', { userId: this.userId });

    // Escuchar nuevas notificaciones
    this.socket.on('newNotification', (notification: Notification) => {
      console.log('🔔 Nueva notificación recibida:', notification);
      this.handleNewNotification(notification);
    });

    // Escuchar eventos de conexión
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 Desconectado del servidor:', reason);
      
      if (reason === 'io server disconnect') {
        // El servidor desconectó, intentar reconectar
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
      // Reunirse a la sala del usuario
      this.socket?.emit('joinUserRoom', { userId: this.userId });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Error al reconectar:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión después de múltiples intentos');
    });
  }

  /**
   * Configurar lógica de reconexión
   */
  private setupReconnectionLogic(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
          if (!this.isConnected) {
            this.socket?.connect();
          }
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }

  /**
   * Manejar nueva notificación
   */
  private handleNewNotification(notification: Notification): void {
    // Mostrar notificación push del navegador
    this.showBrowserNotification(notification);
    
    // Emitir evento personalizado para que los componentes se actualicen
    window.dispatchEvent(new CustomEvent('newNotification', { 
      detail: notification 
    }));

    // Reproducir sonido de notificación (opcional)
    this.playNotificationSound();
  }

  /**
   * Mostrar notificación del navegador
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones del sistema');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // Cambiar por tu icono
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: notification.priority === 'critical',
        data: notification,
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  /**
   * Reproducir sonido de notificación
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3'); // Cambiar por tu archivo de sonido
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('No se pudo reproducir el sonido:', error);
      });
    } catch (error) {
      console.log('Error al reproducir sonido:', error);
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones del sistema');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Permisos de notificación denegados');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Verificar estado de conexión
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Desconectado del servidor de notificaciones');
    }
  }

  /**
   * Enviar mensaje personalizado al servidor
   */
  sendMessage(event: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('No hay conexión activa para enviar mensaje');
    }
  }
}
```

## 🎨 2. Componente React

**Archivo:** `src/components/NotificationComponent.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { NotificationService, Notification } from '../services/notification-service';

interface NotificationComponentProps {
  userId: string;
  token: string;
}

export const NotificationComponent: React.FC<NotificationComponentProps> = ({ 
  userId, 
  token 
}) => {
  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Crear instancia del servicio
    const service = new NotificationService(userId, token);
    setNotificationService(service);

    // Solicitar permisos de notificación
    service.requestNotificationPermission().then(granted => {
      setPermissionGranted(granted);
    });

    // Conectar al servidor
    service.connect().then(() => {
      setIsConnected(true);
    }).catch(error => {
      console.error('Error al conectar:', error);
    });

    // Escuchar nuevas notificaciones
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      service.disconnect();
    };
  }, [userId, token]);

  const handleRequestPermission = async () => {
    if (notificationService) {
      const granted = await notificationService.requestNotificationPermission();
      setPermissionGranted(granted);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/test-push/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Notificación de prueba enviada');
      }
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read' }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notification-component">
      <div className="notification-header">
        <h3>🔔 Notificaciones</h3>
        <div className="notification-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="notification-controls">
        {!permissionGranted && (
          <button 
            onClick={handleRequestPermission}
            className="permission-btn"
          >
            🔔 Solicitar Permisos de Notificación
          </button>
        )}
        
        <button 
          onClick={handleTestNotification}
          className="test-btn"
          disabled={!isConnected}
        >
          🧪 Enviar Notificación de Prueba
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="no-notifications">No hay notificaciones</p>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.status} ${notification.priority}`}
            >
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  <span className="type">{notification.type}</span>
                  <span className="priority">{notification.priority}</span>
                  <span className="time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {notification.status === 'unread' && (
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="mark-read-btn"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .notification-component {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }

        .notification-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-indicator {
          font-size: 14px;
          font-weight: 500;
        }

        .status-indicator.connected {
          color: #22c55e;
        }

        .status-indicator.disconnected {
          color: #ef4444;
        }

        .unread-badge {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }

        .notification-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .permission-btn, .test-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .permission-btn {
          background: #3b82f6;
          color: white;
        }

        .permission-btn:hover {
          background: #2563eb;
        }

        .test-btn {
          background: #10b981;
          color: white;
        }

        .test-btn:hover:not(:disabled) {
          background: #059669;
        }

        .test-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          transition: all 0.2s;
        }

        .notification-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .notification-item.unread {
          border-left: 4px solid #3b82f6;
          background: #f8fafc;
        }

        .notification-item.read {
          opacity: 0.7;
        }

        .notification-item.critical {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .notification-item.high {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .notification-item.medium {
          border-left-color: #10b981;
          background: #f0fdf4;
        }

        .notification-item.low {
          border-left-color: #6b7280;
          background: #f9fafb;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .notification-content p {
          margin: 0 0 12px 0;
          color: #4b5563;
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .type, .priority {
          text-transform: uppercase;
          font-weight: 500;
        }

        .mark-read-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .mark-read-btn:hover {
          background: #059669;
          transform: scale(1.1);
        }

        .no-notifications {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 40px 20px;
        }
      `}</style>
    </div>
  );
};
```

## 🪝 3. Hook Personalizado (Opcional)

**Archivo:** `src/hooks/useNotificationService.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '../services/notification-service';

export const useNotificationService = (userId: string, token: string) => {
  const [service, setService] = useState<NotificationService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Crear servicio
  useEffect(() => {
    const notificationService = new NotificationService(userId, token);
    setService(notificationService);

    return () => {
      notificationService.disconnect();
    };
  }, [userId, token]);

  // Conectar y configurar
  const connect = useCallback(async () => {
    if (!service) return;

    try {
      // Solicitar permisos
      const granted = await service.requestNotificationPermission();
      setPermissionGranted(granted);

      // Conectar al servidor
      await service.connect();
      setIsConnected(true);

      // Escuchar nuevas notificaciones
      const handleNewNotification = (event: CustomEvent) => {
        const notification = event.detail;
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      window.addEventListener('newNotification', handleNewNotification as EventListener);

      return () => {
        window.removeEventListener('newNotification', handleNewNotification as EventListener);
      };
    } catch (error) {
      console.error('Error al conectar:', error);
      setIsConnected(false);
    }
  }, [service]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (service) {
      service.disconnect();
      setIsConnected(false);
    }
  }, [service]);

  // Marcar como leída
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, status: 'read' }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Enviar notificación de prueba
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/notifications/test-push/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Notificación de prueba enviada');
      }
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
    }
  }, [userId, token]);

  return {
    service,
    isConnected,
    notifications,
    unreadCount,
    permissionGranted,
    connect,
    disconnect,
    markAsRead,
    sendTestNotification,
  };
};
```

## 📦 4. Instalación de Dependencias

```bash
# Instalar Socket.IO client
npm install socket.io-client
# o
yarn add socket.io-client
# o
pnpm add socket.io-client

# Instalar tipos si usas TypeScript
npm install -D @types/socket.io-client
```

## 🚀 5. Uso en tu Aplicación

```tsx
import React from 'react';
import { NotificationComponent } from './components/NotificationComponent';

function App() {
  // Obtener estos valores de tu sistema de autenticación
  const userId = "123"; // ID del usuario autenticado
  const token = "jwt-token"; // Token JWT del usuario

  return (
    <div className="App">
      <h1>Mi Aplicación</h1>
      
      {/* Componente de notificaciones */}
      <NotificationComponent userId={userId} token={token} />
      
      {/* Resto de tu aplicación */}
    </div>
  );
}

export default App;
```

## 🔧 6. Configuración

### Cambiar URL del Servidor

En `notification-service.ts`, cambia la URL:

```typescript
// Para desarrollo
this.socket = io('http://localhost:3000/notifications', {

// Para producción
this.socket = io('https://tu-dominio.com/notifications', {
```

### Cambiar Iconos y Sonidos

```typescript
// Cambiar iconos
icon: '/tu-icono.png',
badge: '/tu-badge.png',

// Cambiar sonido
const audio = new Audio('/tu-sonido.mp3');
```

## ✅ ¡Listo!

Ahora tienes un sistema completo de notificaciones push en tiempo real que:

- ✅ Se conecta automáticamente al backend
- ✅ Recibe notificaciones en tiempo real
- ✅ Muestra notificaciones del navegador
- ✅ Se reconecta automáticamente
- ✅ Tiene una interfaz React lista para usar
- ✅ Se integra con tu cron job existente

¡Las notificaciones llegarán automáticamente cuando se creen desde el backend! 🎉
