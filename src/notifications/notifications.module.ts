import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { ProductMonitoringService } from './product-monitoring.service';
import { GeneralProduct } from '../products/entities/general-product.entity';
import { Medicine } from '../products/entities/medicine.entity';
import { CommonModule } from '../common/common.module';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from '../auth/auth.module';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, GeneralProduct, Medicine]),
    CommonModule,
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ProductMonitoringService,
    NotificationsGateway,
    WsJwtGuard,
  ],
  exports: [
    NotificationsService,
    ProductMonitoringService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
