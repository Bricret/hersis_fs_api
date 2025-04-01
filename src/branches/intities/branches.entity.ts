import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


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
    
}