import { Branch } from "src/branches/intities/branches.entity";
import { Sale } from "src/sales/entities/sale.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'cash'
})
export class Cash {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'timestamp' })
    fecha_apertura: Date;

    @Column({ type: 'timestamp', nullable: true })
    fecha_cierre: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monto_inicial: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    ventas_totales: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    monto_esperado: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    monto_final: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    diferencia: number;

    @Column({
        type: 'enum',
        enum: ['abierta', 'cerrada'],
        default: 'abierta'
    })
    estado: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relaciones
    @ManyToOne(() => Branch, branch => branch.cash_registers)
    branch: Branch;

    @ManyToOne(() => User, user => user.cash_opened)
    user_apertura: User;

    @ManyToOne(() => User, user => user.cash_closed, { nullable: true })
    user_cierre: User;

    @OneToMany(() => Sale, sale => sale.cash_register, { cascade: true })
    sales: Sale[];
}

export enum CashStatus {
    ABIERTA = 'abierta',
    CERRADA = 'cerrada'
} 