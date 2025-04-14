import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
