import { SaleDetail } from 'src/sale_detail/entities/sale_detail.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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
  quantity: number;

  @Column()
  expiration_date: Date;

  @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.product, {
    cascade: true,
  })
  saleDetails: SaleDetail[];
}
