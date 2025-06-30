import { SaleDetail } from "src/sale_detail/entities/sale_detail.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Branch } from "src/branches/intities/branches.entity";
import { Cash } from "src/cash/entities/cash.entity";
import { User } from "src/users/entities/user.entity";

@Entity({
    name: 'sales'
})
export class Sale {

    @PrimaryGeneratedColumn('increment')
    id: bigint;

    @Column()
    date: Date;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    total: number;

    @ManyToOne(() => Branch, branch => branch.sales)
    branch: Branch;

    @ManyToOne(() => Cash, cash => cash.sales, { nullable: true })
    cash_register: Cash;

    @ManyToOne(() => User, user => user.sales)
    user: User;

    @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.sale, {
        cascade: true,
      })
    saleDetails: SaleDetail[]; 


}