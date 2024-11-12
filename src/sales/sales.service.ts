import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class SalesService {

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    private readonly commonService: CommonService
  ) {}

  async create(createSaleDto: CreateSaleDto) {

    try {
      const sale = this.saleRepository.create(createSaleDto);
      await this.saleRepository.save(sale);
      return sale;
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findAll() {

    try {
      return await this.saleRepository.find();
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'BR');
    }

  }

  async findOne(id: number) {

    try {
      return await this.saleRepository.findOne({
        where: { id: BigInt(id) },
      });
    } catch (error) {
      this.commonService.handleExceptions(error.message, 'NF');
    }

  }

  //TODO: Implement the GenerateReport method
  async GenerateReport(createReporteDto: CreateReportDto) {
    console.log('GenerateReport' + createReporteDto);
  }
}
