import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CashService } from './cash.service';
import { CreateCashDto, CloseCashDto, QueryCashDto, UpdateCashDto } from './dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCashDto: CreateCashDto) {
    return this.cashService.create(createCashDto);
  }

  @Get()
  findAll(@Query() query: QueryCashDto) {
    return this.cashService.findAll(query);
  }

  @Get('active/:branchId')
  findActiveCash(@Param('branchId') branchId: string) {
    return this.cashService.findActiveCashByBranch(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashService.findOne(id);
  }

  @Get(':id/summary')
  getCashSummary(@Param('id') id: string) {
    return this.cashService.getCashSummary(id);
  }

  @Get(':id/sales')
  getCashSales(@Param('id') id: string) {
    return this.cashService.getCashSales(id);
  }

  @Get(':id/report/pdf')
  async getCashReportPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.cashService.generateCashReportPdf(id);
    const fileName = `reporte-caja-${id}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-store',
    });

    res.end(pdfBuffer);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCashDto: UpdateCashDto) {
    return this.cashService.update(id, updateCashDto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  closeCash(@Param('id') id: string, @Body() closeCashDto: CloseCashDto) {
    return this.cashService.closeCash(id, closeCashDto);
  }

  @Post(':id/sync-totals')
  @HttpCode(HttpStatus.OK)
  syncCashTotals(@Param('id') id: string) {
    return this.cashService.syncCashTotals(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cashService.remove(id);
  }
} 