import { TransactionHistory } from "src/transaction_history/entities/transaction_history.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Branch } from "src/branches/intities/branches.entity";
import { Cash } from "src/cash/entities/cash.entity";

@Entity({
    name: 'user'
})
export class User {


    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    username: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column()
    password: string;

    @Column({
        enum: ['admin', 'user'],
    })
    role: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({nullable: true})
    lastLogin: Date;

    @ManyToOne(() => Branch, branch => branch.users)
    branch: Branch;

    @OneToMany(() => TransactionHistory, transactionHistory => transactionHistory.user)
    transactions: TransactionHistory[];

    @OneToMany(() => Cash, cash => cash.user_apertura)
    cash_opened: Cash[];

    @OneToMany(() => Cash, cash => cash.user_cierre)
    cash_closed: Cash[];

}


export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}