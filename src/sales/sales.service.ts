import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Branch } from 'src/branches/intities/branches.entity';
import { Cash } from 'src/cash/entities/cash.entity';
import { CashStatus } from 'src/cash/entities/cash.entity';

@Injectable()
export class SalesService {

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Cash)
    private readonly cashRepository: Repository<Cash>,
    private readonly commonService: CommonService
  ) {}

  async create(createSaleDto: CreateSaleDto) {

    try {
      const { branch_id, ...saleData } = createSaleDto;

      // Verificar que la sucursal existe
      const branch = await this.branchRepository.findOne({
        where: { id: branch_id },
      });
      if (!branch) {
        throw new BadRequestException('Sucursal no encontrada');
      }

      // Buscar la caja abierta en la sucursal
      const activeCash = await this.cashRepository.findOne({
        where: {
          branch: { id: branch_id },
          estado: CashStatus.ABIERTA,
        },
      });

      if (!activeCash) {
        throw new BadRequestException('No hay una caja abierta en esta sucursal. Debe abrir una caja antes de realizar ventas.');
      }

      // Crear la venta asignándola a la caja abierta
      const sale = this.saleRepository.create({
        ...saleData,
        date: new Date(),
        branch,
        cash_register: activeCash,
      });

      await this.saleRepository.save(sale);
      return sale;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findAll() {

    try {
      return await this.saleRepository.find({
        relations: ['branch', 'cash_register'],
        order: { date: 'DESC' },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findOne(id: number) {

    try {
      return await this.saleRepository.findOne({
        where: { id: BigInt(id) },
        relations: ['branch', 'cash_register', 'saleDetails'],
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }

  }

  async findByCash(cashId: string) {
    try {
      return await this.saleRepository.find({
        where: { cash_register: { id: cashId } },
        relations: ['branch', 'cash_register', 'saleDetails'],
        order: { date: 'DESC' },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  async getSalesSummaryByCash(cashId: string) {
    try {
      const sales = await this.findByCash(cashId);
      const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      
      return {
        cash_id: cashId,
        total_sales_count: sales.length,
        total_amount: totalAmount,
        sales: sales,
      };
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }
  }

  //TODO: Implement the GenerateReport method
  async GenerateReport(createReporteDto: CreateReportDto) {
    console.log('GenerateReport' + createReporteDto);
  }
}
