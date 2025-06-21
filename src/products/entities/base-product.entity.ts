import { Category } from 'src/category/entities/category.entity';
import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseProduct {
  @PrimaryGeneratedColumn('increment')
  id: bigint;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  sales_price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  purchase_price: number;

  @Column()
  initial_quantity: number;

  @Column()
  barCode: string;

  @Column()
  units_per_box: number;

  @Column()
  lot_number: string;

  @Column()
  expiration_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ['medicine', 'general'], default: 'general' })
  type: 'medicine' | 'general';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne('Branch', 'generalProducts')
  @JoinColumn({ name: 'branch_id' })
  branch: any;
} 