import { SaleDetail } from "src/sale_detail/entities/sale_detail.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Branch } from "src/branches/intities/branches.entity";

@Entity({
    name: 'sales'
})
export class Sale {

    @PrimaryGeneratedColumn('increment')
    id: bigint;

    @Column()
    date: Date;

    @Column()
    total: number;

    @ManyToOne(() => Branch, branch => branch.sales)
    branch: Branch;

    @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.sale, {
        cascade: true,
      })
    saleDetails: SaleDetail[]; 
    


}
