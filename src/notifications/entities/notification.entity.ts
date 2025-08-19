import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  LOW_STOCK = 'low_stock',
  EXPIRATION_WARNING = 'expiration_warning',
  SALE_REMINDER = 'sale_reminder',
  SYSTEM_ALERT = 'system_alert',
  INVENTORY_ALERT = 'inventory_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed',
  ARCHIVED = 'archived',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: bigint;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.LOW,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  entity_type: string; // 'product', 'sale', 'user', etc.

  @Column({ type: 'bigint', nullable: true })
  entity_id: string; // ID de la entidad relacionada

  @Column({ nullable: true })
  user_id: string; // Usuario al que va dirigida la notificación

  @Column({ nullable: true })
  branch_id: string; // Sucursal a la que pertenece

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date; // Fecha de expiración de la notificación

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
