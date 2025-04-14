import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Sale } from "src/sales/entities/sale.entity";
import { TransactionHistory } from "src/transaction_history/entities/transaction_history.entity";

@Entity('branches')
export class Branch {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column()
    phone: string;
    
    @OneToMany(() => User, user => user.branch)
    users: User[];

    @OneToMany('GeneralProduct', 'branch')
    generalProducts: any[];

    @OneToMany('Medicine', 'branch')
    medicines: any[];

    @OneToMany(() => Sale, sale => sale.branch)
    sales: Sale[];

    @OneToMany(() => TransactionHistory, transaction => transaction.branch)
    transactions: TransactionHistory[];
}