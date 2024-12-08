import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';

  export const actions = ['create', 'update', 'delete', 'sales', 'updateStock'];
  
  @Entity('logs')
  export class Log {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({
        enum: actions,
    })
    action: string;
  
    @Column({ nullable: true })
    entity: string; // Nombre de la entidad afectada, ej: 'product', 'sale'

    @Column({ nullable: true })
    description: string; // Descripción de la acción realizada
  
    @Column({ nullable: true })
    userId: string; // ID del usuario que realizó la acción
  
    @CreateDateColumn()
    timestamp: Date; // Fecha y hora del registro
  }
  