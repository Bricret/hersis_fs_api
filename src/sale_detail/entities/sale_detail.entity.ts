import { BaseProduct } from 'src/products/entities/base-product.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'sale_details',
})
export class SaleDetail {
  @PrimaryGeneratedColumn('increment')
  id: bigint;

  @Column()
  quantity: number;

  @Column()
  unit_price: number;

  @Column()
  subtotal: number;

  @ManyToOne(() => Sale, (sale) => sale.saleDetails)
  sale: Sale;

  @ManyToOne(() => BaseProduct, (product) => product.saleDetails, { eager: true })
  product: BaseProduct;
}
