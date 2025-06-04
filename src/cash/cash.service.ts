import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cash, CashStatus } from './entities/cash.entity';
import { CreateCashDto, CloseCashDto, UpdateCashDto } from './dto';
import { Branch } from 'src/branches/intities/branches.entity';
import { User } from 'src/users/entities/user.entity';
import { Sale } from 'src/sales/entities/sale.entity';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(Cash)
    private cashRepository: Repository<Cash>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
  ) {}

  async create(createCashDto: CreateCashDto): Promise<Cash> {
    const { branch_id, user_apertura_id, ...cashData } = createCashDto;

    // Verificar que no haya una caja abierta en la sucursal
    const existingOpenCash = await this.cashRepository.findOne({
      where: {
        branch: { id: branch_id },
        estado: CashStatus.ABIERTA,
      },
    });

    if (existingOpenCash) {
      throw new BadRequestException('Ya existe una caja abierta en esta sucursal');
    }

    // Verificar que la sucursal existe
    const branch = await this.branchRepository.findOne({
      where: { id: branch_id },
    });
    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: user_apertura_id },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const cash = this.cashRepository.create({
      ...cashData,
      fecha_apertura: new Date(),
      monto_esperado: cashData.monto_inicial,
      branch,
      user_apertura: user,
    });

    return await this.cashRepository.save(cash);
  }

  async findAll(): Promise<Cash[]> {
    return await this.cashRepository.find({
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Cash> {
    const cash = await this.cashRepository.findOne({
      where: { id },
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
    });

    if (!cash) {
      throw new NotFoundException('Caja no encontrada');
    }

    return cash;
  }

  async findByBranch(branchId: string): Promise<Cash[]> {
    return await this.cashRepository.find({
      where: { branch: { id: branchId } },
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
      order: { created_at: 'DESC' },
    });
  }

  async findActiveCashByBranch(branchId: string): Promise<Cash | null> {
    return await this.cashRepository.findOne({
      where: {
        branch: { id: branchId },
        estado: CashStatus.ABIERTA,
      },
      relations: ['branch', 'user_apertura', 'user_cierre', 'sales'],
    });
  }

  async update(id: string, updateCashDto: UpdateCashDto): Promise<Cash> {
    const cash = await this.findOne(id);

    if (cash.estado === CashStatus.CERRADA) {
      throw new BadRequestException('No se puede modificar una caja cerrada');
    }

    Object.assign(cash, updateCashDto);
    return await this.cashRepository.save(cash);
  }

  async closeCash(id: string, closeCashDto: CloseCashDto): Promise<Cash> {
    const cash = await this.findOne(id);

    if (cash.estado === CashStatus.CERRADA) {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // Calcular ventas totales desde las ventas registradas
    const totalSales = await this.calculateTotalSales(id);

    // Verificar que el usuario de cierre existe
    const userCierre = await this.userRepository.findOne({
      where: { id: closeCashDto.user_cierre_id },
    });
    if (!userCierre) {
      throw new NotFoundException('Usuario de cierre no encontrado');
    }

    // Actualizar la caja
    cash.fecha_cierre = new Date();
    cash.monto_final = closeCashDto.monto_final;
    cash.ventas_totales = totalSales;
    cash.monto_esperado = cash.monto_inicial + totalSales;
    cash.diferencia = cash.monto_final - cash.monto_esperado;
    cash.estado = CashStatus.CERRADA;
    cash.user_cierre = userCierre;
    
    if (closeCashDto.observaciones) {
      cash.observaciones = closeCashDto.observaciones;
    }

    return await this.cashRepository.save(cash);
  }

  async calculateTotalSales(cashId: string): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('SUM(sale.total)', 'total')
      .where('sale.cash_register = :cashId', { cashId })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async remove(id: string): Promise<void> {
    const cash = await this.findOne(id);
    
    if (cash.estado === CashStatus.ABIERTA) {
      throw new BadRequestException('No se puede eliminar una caja abierta');
    }

    await this.cashRepository.remove(cash);
  }

  async getCashSummary(id: string) {
    const cash = await this.findOne(id);
    
    const salesCount = await this.saleRepository.count({
      where: { cash_register: { id } },
    });

    return {
      ...cash,
      cantidad_ventas: salesCount,
      porcentaje_diferencia: cash.monto_esperado > 0 
        ? ((cash.diferencia / cash.monto_esperado) * 100).toFixed(2)
        : 0,
    };
  }

  async getCashSales(id: string) {
    const cash = await this.findOne(id);
    
    const sales = await this.saleRepository.find({
      where: { cash_register: { id } },
      relations: ['branch', 'saleDetails'],
      order: { date: 'DESC' },
    });

    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      cash_info: {
        id: cash.id,
        fecha_apertura: cash.fecha_apertura,
        fecha_cierre: cash.fecha_cierre,
        estado: cash.estado,
        monto_inicial: cash.monto_inicial,
      },
      sales_summary: {
        total_sales_count: sales.length,
        total_amount: totalAmount,
      },
      sales: sales,
    };
  }
} 