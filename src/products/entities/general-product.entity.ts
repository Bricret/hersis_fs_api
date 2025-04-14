import { BaseProduct } from './base-product.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'general_products',
})
export class GeneralProduct extends BaseProduct {
  @Column()
  brand: string;

  @Column()
  model: string;
} 