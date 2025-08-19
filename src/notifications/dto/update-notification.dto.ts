import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';
import { NotificationStatus } from '../entities/notification.entity';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;
}
