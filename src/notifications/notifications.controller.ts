import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseArrayPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ProductMonitoringService } from './product-monitoring.service';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  FindNotificationsDto 
} from './dto';
import { NotificationType, NotificationPriority } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly productMonitoringService: ProductMonitoringService,
  ) {}

  /**
   * Crear una nueva notificación
   */
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  /**
   * Obtener todas las notificaciones con filtros
   */
  @Get()
  async findAll(@Query() findDto: FindNotificationsDto) {
    return this.notificationsService.findAll(findDto);
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  @Get('unread-count')
  async getUnreadCount(
    @Query('user_id') userId?: string,
    @Query('branch_id') branchId?: string,
  ) {
    const count = await this.notificationsService.getUnreadCount(userId, branchId);
    return { unread_count: count };
  }

  /**
   * Obtener notificación por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  /**
   * Actualizar notificación
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  /**
   * Marcar notificación como leída
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Marcar notificación como descartada
   */
  @Patch(':id/dismiss')
  async dismiss(@Param('id') id: string) {
    return this.notificationsService.dismiss(id);
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  @Patch('bulk/read')
  async markMultipleAsRead(
    @Body('ids', new ParseArrayPipe({ items: String, separator: ',' })) 
    ids: string[],
  ) {
    await this.notificationsService.markMultipleAsRead(ids);
    return { message: 'Notificaciones marcadas como leídas' };
  }

  /**
   * Eliminar notificación
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.notificationsService.remove(id);
    return { message: 'Notificación eliminada exitosamente' };
  }

  /**
   * Verificar manualmente un producto específico
   */
  @Post('check-product/:id')
  async checkProduct(
    @Param('id') productId: string,
    @Query('type') productType: 'medicine' | 'general' = 'general',
  ) {
    await this.productMonitoringService.checkSpecificProduct(productId, productType);
    return { message: `Verificación completada para producto ${productId}` };
  }

  /**
   * Ejecutar manualmente verificación de bajo stock
   */
  @Post('check-low-stock')
  async checkLowStock() {
    await this.productMonitoringService.checkLowStockProducts();
    return { message: 'Verificación de bajo stock ejecutada exitosamente' };
  }

  /**
   * Ejecutar manualmente verificación de productos próximos a vencer
   */
  @Post('check-expiring')
  async checkExpiring() {
    await this.productMonitoringService.checkExpiringProducts();
    return { message: 'Verificación de productos próximos a vencer ejecutada exitosamente' };
  }

  @Post('test-push/:userId')
  async testPushNotification(@Param('userId') userId: string) {
    const testNotification = await this.notificationsService.create({
      type: NotificationType.SYSTEM_ALERT,
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación de prueba para verificar las notificaciones push',
      priority: NotificationPriority.MEDIUM,
      user_id: userId,
      entity_type: 'test',
      entity_id: 'test-123',
    });

    return {
      message: 'Notificación de prueba enviada',
      notification: testNotification,
    };
  }
}
