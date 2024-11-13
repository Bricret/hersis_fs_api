import { Product } from "src/products/entities/product.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'categories'
})
export class Category {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;
    
    @OneToMany(() => Product, (product) => product.category)
    products: Product[];

}
