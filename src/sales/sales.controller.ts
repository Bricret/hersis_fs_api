import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { SalesAnalyticsDto } from './dto/sales-analytics.dto';

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

  @Get('by-branch/:branchId')
  findByBranch(@Param('branchId') branchId: string) {
    return this.salesService.findByBranch(branchId);
  }

  @Get('by-date-range')
  findByDateRange(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('branch_id') branchId?: string
  ) {
    return this.salesService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      branchId
    );
  }

  @Get('summary/by-cash/:cashId')
  getSalesSummaryByCash(@Param('cashId') cashId: string) {
    return this.salesService.getSalesSummaryByCash(cashId);
  }

  @Get('summary/by-branch/:branchId')
  getSalesSummaryByBranch(@Param('branchId') branchId: string) {
    return this.salesService.getSalesSummaryByBranch(branchId);
  }

  @Post('generate-report')
  generateReport(@Body() createReportDto: CreateReportDto) {
    return this.salesService.generateReport(createReportDto);
  }

  @Post('analytics')
  getSalesAnalytics(@Body() analyticsDto: SalesAnalyticsDto) {
    return this.salesService.generateReport({
      date_from: new Date(analyticsDto.start_date),
      date_to: new Date(analyticsDto.end_date),
      user_id: 1 // Se podría obtener del token JWT
    });
  }

  @Delete('cancel/:id')
  cancelSale(
    @Param('id') id: string, 
    @Body() cancelSaleDto: CancelSaleDto
  ) {
    return this.salesService.cancelSale(+id, cancelSaleDto.reason);
  }
}
