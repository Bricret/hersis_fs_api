import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { ProductMonitoringService } from './product-monitoring.service';
import { GeneralProduct } from '../products/entities/general-product.entity';
import { CommonModule } from '../common/common.module';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, GeneralProduct]),
    CommonModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ProductMonitoringService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    ProductMonitoringService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
