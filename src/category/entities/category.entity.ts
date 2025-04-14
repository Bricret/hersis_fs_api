import { BaseProduct } from 'src/products/entities/base-product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
    name: 'categories'
})
export class Category {

    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;
    
    @Column()
    description: string;

    @OneToMany(() => BaseProduct, (product) => product.category)
    products: BaseProduct[];

}
