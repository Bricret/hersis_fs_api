import { TransactionHistory } from "src/transaction_history/entities/transaction_history.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @OneToMany(() => TransactionHistory, transactionHistory => transactionHistory.user)
    transactions: TransactionHistory[];

}


export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}