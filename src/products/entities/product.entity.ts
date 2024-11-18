import { Category } from 'src/category/entities/category.entity';
import { SaleDetail } from 'src/sale_detail/entities/sale_detail.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'products',
})
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: bigint;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  cost_price: number;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  units_per_blister: number;

  @Column()
  expiration_date: Date;

  @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.product, {
    cascade: true,
  })
  saleDetails: SaleDetail[];

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoria_id' })
  category: Category;
}
