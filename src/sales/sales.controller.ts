import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(+id);
  }

  @Get('by-cash/:cashId')
  findByCash(@Param('cashId') cashId: string) {
    return this.salesService.findByCash(cashId);
  }

  @Get('summary/by-cash/:cashId')
  getSalesSummaryByCash(@Param('cashId') cashId: string) {
    return this.salesService.getSalesSummaryByCash(cashId);
  }

  @Get('report')
  GenerateReport(@Body() createReporteDto: CreateReportDto) {
    return this.salesService.GenerateReport(createReporteDto);
  }


}
