

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
    name: 'presentations'
})
export class Presentation {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;
}
