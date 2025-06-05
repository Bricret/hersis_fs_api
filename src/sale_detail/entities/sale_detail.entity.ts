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

  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @Column({ type: 'varchar', length: 20 })
  product_type: 'medicine' | 'general';

  @ManyToOne(() => Sale, (sale) => sale.saleDetails)
  sale: Sale;
}
