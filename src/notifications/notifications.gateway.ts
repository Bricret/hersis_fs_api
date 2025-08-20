import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: "*", // Configura según tu dominio en producción
    methods: ["GET", "POST"],
    credentials: true
  },
  namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, Socket>();

  @UseGuards(WsJwtGuard)
  handleConnection(client: Socket) {
    const userId = client.handshake.headers.userid as string;
    if (userId) {
      this.connectedUsers.set(userId, client);
      client.join(`user_${userId}`);
      this.logger.log(`Usuario ${userId} conectado a notificaciones`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.headers.userid as string;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Usuario ${userId} desconectado de notificaciones`);
    }
  }

  @SubscribeMessage('joinUserRoom')
  @UseGuards(WsJwtGuard)
  handleJoinUserRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.handshake.headers.userid as string;
    if (userId) {
      client.join(`user_${userId}`);
      this.logger.log(`Usuario ${userId} se unió a su sala de notificaciones`);
    }
  }

  // Método para enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('newNotification', notification);
    this.logger.log(`Notificación enviada al usuario ${userId}`);
  }

  // Método para enviar notificación a todos los usuarios conectados
  sendNotificationToAll(notification: any) {
    this.server.emit('newNotification', notification);
    this.logger.log('Notificación enviada a todos los usuarios');
  }

  // Método para enviar notificación a múltiples usuarios
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Método para obtener usuarios conectados
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Método para verificar si un usuario está conectado
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
