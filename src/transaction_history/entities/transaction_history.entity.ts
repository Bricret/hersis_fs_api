import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity({ name: 'transaction_history' })
export class TransactionHistory {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.transactions)
    user: User;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column()
    timestamp: Date;

    @Column('json', { nullable: true })
    details: object;
}
