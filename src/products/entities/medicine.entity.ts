import { BaseProduct } from './base-product.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'medicines',
})
export class Medicine extends BaseProduct {
  @Column()
  active_name: string;

  @Column()
  dosage: string;

  @Column()
  prescription: boolean;

  @Column()
  laboratory: string;

  @Column()
  registration_number: string;

  @Column()
  storage_conditions: string;

  @Column('simple-array')
  active_ingredients: string[];

  @Column()
  warnings: string;

  @Column()
  administration_route: string;
} 