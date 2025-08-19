import { 
  IsEnum, 
  IsString, 
  IsOptional, 
  IsObject, 
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType, NotificationPriority } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  message: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  entity_type?: string;

  @IsString()
  @IsOptional()
  entity_id?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  branch_id?: string;

  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
