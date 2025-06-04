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
} from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashDto, CloseCashDto, UpdateCashDto } from './dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCashDto: CreateCashDto) {
    return this.cashService.create(createCashDto);
  }

  @Get()
  findAll(@Query('branch_id') branchId?: string) {
    if (branchId) {
      return this.cashService.findByBranch(branchId);
    }
    return this.cashService.findAll();
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCashDto: UpdateCashDto) {
    return this.cashService.update(id, updateCashDto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  closeCash(@Param('id') id: string, @Body() closeCashDto: CloseCashDto) {
    return this.cashService.closeCash(id, closeCashDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cashService.remove(id);
  }
} 