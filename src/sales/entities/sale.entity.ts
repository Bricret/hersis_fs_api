import { SaleDetail } from "src/sale_detail/entities/sale_detail.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'sales'
})
export class Sale {

    //TODO: Add the missing columns for the Sale entity
    @PrimaryGeneratedColumn('increment')
    id: bigint;

    @Column()
    date: Date;

    @Column()
    total: number;

    @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.sale, {
        cascade: true,
      })
      saleDetails: SaleDetail[];


}
