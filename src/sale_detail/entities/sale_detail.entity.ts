import { Product } from 'src/products/entities/product.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'sale_detail',
})
export class SaleDetail {
  @PrimaryGeneratedColumn('increment')
  id: bigint;

  @Column()
  quantity: number;

  @Column()
  unit_price: number;

  @ManyToOne(() => Sale, (sale) => sale.saleDetails, {
    onDelete: 'CASCADE',
  })
  sale: bigint;

  @ManyToOne(() => Product, (product) => product.id, { eager: true })
  product: bigint;
}
