import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Branch } from "src/branches/intities/branches.entity";

@Entity({ name: 'transaction_history' })
export class TransactionHistory {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.transactions)
    user: User;

    @ManyToOne(() => Branch, branch => branch.transactions)
    branch: Branch;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column()
    timestamp: Date;

    @Column('json', { nullable: true })
    details: object;
}
