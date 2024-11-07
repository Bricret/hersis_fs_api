import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity({
    name: 'products'
})
export class Product {

    @PrimaryGeneratedColumn('increment')
    id: bigint;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    price: number;

    @Column()
    quantity: number;

    @Column()
    expiration_date: Date;

}
