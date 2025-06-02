import { BaseProduct } from './base-product.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Presentation } from '../../presentation/entities/presentation.entity';

@Entity({
  name: 'medicines',
})
export class Medicine extends BaseProduct {
  @Column({
    nullable: true,
  })
  active_name?: string;

  @Column({
    nullable: true,
  })
  dosage?: string;

  @Column()
  prescription: boolean;

  @Column()
  laboratory: string;

  @Column({
    nullable: true,
  })
  administration_route?: string;

  @ManyToOne(() => Presentation)
  @JoinColumn({ name: 'presentation_id' })
  presentation: Presentation;

  @Column({ nullable: true })
  presentation_id: number;
} 