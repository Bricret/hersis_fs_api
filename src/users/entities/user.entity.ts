import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

}
