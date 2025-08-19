import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from '../entities/notification.entity';
import { Transform, Type } from 'class-transformer';

export class FindNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  branch_id?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  entity_id?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}
