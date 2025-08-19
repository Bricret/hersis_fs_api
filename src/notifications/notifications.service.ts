import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommonService } from '../common/common.service';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from './entities/notification.entity';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  FindNotificationsDto 
} from './dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly commonService: CommonService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Crear una nueva notificación
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        ...createNotificationDto,
        priority: createNotificationDto.priority || NotificationPriority.LOW,
        status: NotificationStatus.UNREAD,
        is_active: createNotificationDto.is_active ?? true,
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // Enviar notificación en tiempo real si tiene usuario asignado
      if (savedNotification.user_id) {
        this.notificationsGateway.sendNotificationToUser(
          savedNotification.user_id.toString(),
          savedNotification
        );
      }

      return savedNotification;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Obtener todas las notificaciones con filtros
   */
  async findAll(findDto: FindNotificationsDto = {}): Promise<{
    notifications: Notification[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const {
        type,
        priority,
        status,
        user_id,
        branch_id,
        entity_type,
        entity_id,
        is_active,
        from_date,
        to_date,
        limit = 50,
        offset = 0,
      } = findDto;

      const where: any = {};

      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (status) where.status = status;
      if (user_id) where.user_id = user_id;
      if (branch_id) where.branch_id = branch_id;
      if (entity_type) where.entity_type = entity_type;
      if (entity_id) where.entity_id = entity_id;
      if (is_active !== undefined) where.is_active = is_active;

      if (from_date && to_date) {
        where.created_at = Between(new Date(from_date), new Date(to_date));
      } else if (from_date) {
        where.created_at = Between(new Date(from_date), new Date());
      }

      const findOptions: FindManyOptions<Notification> = {
        where,
        order: {
          created_at: 'ASC',
        },
        take: limit,
        skip: offset,
      };

      const [notifications, total] = await this.notificationRepository.findAndCount(findOptions);

      return {
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Obtener notificación por ID
   */
  async findOne(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: BigInt(id) },
      });

      if (!notification) {
        this.commonService.handleExceptions(
          'Notificación no encontrada',
          'NF',
        );
      }

      return notification;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Actualizar notificación
   */
  async update(id: string, updateDto: UpdateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.findOne(id);
      
      Object.assign(notification, updateDto);
      
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { status: NotificationStatus.READ });
  }

  /**
   * Marcar notificación como descartada
   */
  async dismiss(id: string): Promise<Notification> {
    return this.update(id, { status: NotificationStatus.DISMISSED });
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleAsRead(ids: string[]): Promise<void> {
    try {
      await this.notificationRepository.update(
        { id: In(ids.map(id => BigInt(id))) },
        { status: NotificationStatus.READ }
      );
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Eliminar notificación
   */
  async remove(id: string): Promise<void> {
    try {
      const notification = await this.findOne(id);
      await this.notificationRepository.remove(notification);
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Limpiar notificaciones expiradas
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where('expires_at < :now', { now })
        .execute();
      
      console.log('Notificaciones expiradas eliminadas');
    } catch (error) {
      console.error('Error limpiando notificaciones expiradas:', error);
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas por usuario
   */
  async getUnreadCount(userId?: string, branchId?: string): Promise<number> {
    try {
      const where: any = {
        status: NotificationStatus.UNREAD,
        is_active: true,
      };

      if (userId) where.user_id = userId;
      if (branchId) where.branch_id = branchId;

      return await this.notificationRepository.count({ where });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  /**
   * Crear notificación de producto con bajo stock
   */
  async createLowStockNotification(
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
    branchId?: string,
  ): Promise<Notification> {
    const notification: CreateNotificationDto = {
      type: NotificationType.LOW_STOCK,
      title: 'Stock Bajo',
      message: `El producto "${productName}" tiene stock bajo. Stock actual: ${currentStock}, mínimo requerido: ${minStock}`,
      priority: currentStock === 0 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
      entity_type: 'product',
      entity_id: productId,
      branch_id: branchId,
      metadata: {
        current_stock: currentStock,
        min_stock: minStock,
        product_name: productName,
      },
    };

    return this.create(notification);
  }

  /**
   * Crear notificación de producto próximo a vencer
   */
  async createExpirationWarningNotification(
    productId: string,
    productName: string,
    expirationDate: Date,
    daysUntilExpiration: number,
    branchId?: string,
  ): Promise<Notification> {
    let priority = NotificationPriority.LOW;
    let title = 'Producto próximo a vencer';

    if (daysUntilExpiration <= 0) {
      priority = NotificationPriority.CRITICAL;
      title = 'Producto vencido';
    } else if (daysUntilExpiration <= 7) {
      priority = NotificationPriority.HIGH;
    } else if (daysUntilExpiration <= 30) {
      priority = NotificationPriority.MEDIUM;
    }

    const notification: CreateNotificationDto = {
      type: NotificationType.EXPIRATION_WARNING,
      title,
      message: `El producto "${productName}" ${daysUntilExpiration <= 0 ? 'ya está vencido' : `vence en ${daysUntilExpiration} días`}. Fecha de vencimiento: ${expirationDate.toLocaleDateString()}`,
      priority,
      entity_type: 'product',
      entity_id: productId,
      branch_id: branchId,
      metadata: {
        expiration_date: expirationDate,
        days_until_expiration: daysUntilExpiration,
        product_name: productName,
      },
    };

    return this.create(notification);
  }

  /**
   * Verificar si ya existe una notificación similar activa
   */
  async existsSimilarNotification(
    type: NotificationType,
    entityId: string,
    entityType: string,
  ): Promise<boolean> {
    try {
      const count = await this.notificationRepository.count({
        where: {
          type,
          entity_id: entityId,
          entity_type: entityType,
          status: In([NotificationStatus.UNREAD, NotificationStatus.READ]),
          is_active: true,
        },
      });

      return count > 0;
    } catch (error) {
      return false;
    }
  }
}
