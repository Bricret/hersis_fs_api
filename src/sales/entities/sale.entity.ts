import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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


}
